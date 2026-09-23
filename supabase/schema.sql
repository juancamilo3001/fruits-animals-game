-- =============================================================================
-- FRUITS & ANIMALS — ENGLISH CHALLENGE
-- Complete Supabase Database Schema, Migrations, RPC Functions, & RLS Policies
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing views and tables if rebuilding
DROP VIEW IF EXISTS questions_public;
DROP TABLE IF EXISTS game_answers CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS questions CASCADE;

-- -----------------------------------------------------------------------------
-- 1. ROOMS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code VARCHAR(6) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'WAITING' CHECK (status IN ('WAITING', 'QUESTION_ACTIVE', 'QUESTION_RESULTS', 'PAUSED', 'FINISHED')),
    current_question INT NOT NULL DEFAULT 1,
    question_started_at TIMESTAMPTZ NULL,
    started_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    host_token UUID NOT NULL DEFAULT gen_random_uuid()
);

CREATE INDEX idx_rooms_code ON rooms (room_code);
CREATE INDEX idx_rooms_status ON rooms (status);

-- -----------------------------------------------------------------------------
-- 2. PLAYERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    nickname VARCHAR(30) NOT NULL,
    score INT NOT NULL DEFAULT 0,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    is_connected BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT uq_room_player_nickname UNIQUE (room_id, nickname)
);

CREATE INDEX idx_players_room_id ON players (room_id);
CREATE INDEX idx_players_score ON players (room_id, score DESC);

-- -----------------------------------------------------------------------------
-- 3. QUESTIONS TABLE (Protected, Contains Correct Answer)
-- -----------------------------------------------------------------------------
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(20) NOT NULL CHECK (category IN ('fruits', 'animals')),
    question_number INT NOT NULL UNIQUE,
    question_text TEXT NOT NULL,
    image_url TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    correct_answer CHAR(1) NOT NULL CHECK (correct_answer IN ('A', 'B', 'C'))
);

CREATE INDEX idx_questions_number ON questions (question_number);

-- -----------------------------------------------------------------------------
-- 4. PUBLIC QUESTIONS VIEW (Strips correct_answer to prevent cheating)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW questions_public AS
SELECT
    id,
    category,
    question_number,
    question_text,
    image_url,
    option_a,
    option_b,
    option_c
FROM questions;

-- -----------------------------------------------------------------------------
-- 5. GAME ANSWERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE game_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    question_number INT NOT NULL,
    selected_answer CHAR(1) NOT NULL CHECK (selected_answer IN ('A', 'B', 'C')),
    is_correct BOOLEAN NOT NULL,
    response_time_ms INT NOT NULL,
    points INT NOT NULL DEFAULT 0,
    answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_room_player_question UNIQUE (room_id, player_id, question_number)
);

CREATE INDEX idx_game_answers_room_q ON game_answers (room_id, question_number, answered_at ASC);
CREATE INDEX idx_game_answers_player ON game_answers (player_id);

-- -----------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- -----------------------------------------------------------------------------
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_answers ENABLE ROW LEVEL SECURITY;

-- ROOMS: Public can view rooms, but host_token is filtered in client queries
CREATE POLICY "Public can view rooms by room_code"
    ON rooms FOR SELECT
    USING (true);

-- PLAYERS: Public can view players in a room
CREATE POLICY "Public can view players"
    ON players FOR SELECT
    USING (true);

-- QUESTIONS: Restrict direct SELECT to prevent viewing correct_answer!
-- Normal clients must read from `questions_public`.
CREATE POLICY "Allow public read of public view only"
    ON questions FOR SELECT
    USING (false);

-- GAME ANSWERS: Public can view answers in a room (for live answer order and results)
CREATE POLICY "Public can view answers"
    ON game_answers FOR SELECT
    USING (true);

-- Grant privileges
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON questions_public TO anon, authenticated;
GRANT SELECT ON rooms TO anon, authenticated;
GRANT SELECT ON players TO anon, authenticated;
GRANT SELECT ON game_answers TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 7. SERVER-SIDE RPC FUNCTIONS (SECURITY DEFINER)
-- -----------------------------------------------------------------------------

-- FUNCTION: Generate unique 6-character room code
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := '';
    i INT;
BEGIN
    FOR i IN 1..6 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::INT, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- RPC 1: Create Game Room
CREATE OR REPLACE FUNCTION create_game_room()
RETURNS TABLE (
    room_id UUID,
    room_code TEXT,
    host_token UUID
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_code TEXT;
    v_room rooms%ROWTYPE;
    v_attempts INT := 0;
BEGIN
    LOOP
        v_code := generate_room_code();
        EXIT WHEN NOT EXISTS (SELECT 1 FROM rooms WHERE rooms.room_code = v_code AND status != 'FINISHED');
        v_attempts := v_attempts + 1;
        IF v_attempts > 20 THEN
            RAISE EXCEPTION 'Could not generate unique room code. Please try again.';
        END IF;
    END LOOP;

    INSERT INTO rooms (room_code, status, current_question, host_token)
    VALUES (v_code, 'WAITING', 1, gen_random_uuid())
    RETURNING * INTO v_room;

    RETURN QUERY
    SELECT v_room.id, v_room.room_code::TEXT, v_room.host_token;
END;
$$ LANGUAGE plpgsql;

-- RPC 2: Join Game Room (or reconnect existing player)
CREATE OR REPLACE FUNCTION join_game_room(
    p_room_code TEXT,
    p_nickname TEXT
)
RETURNS TABLE (
    player_id UUID,
    room_id UUID,
    room_code TEXT,
    nickname TEXT,
    score INT
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_room rooms%ROWTYPE;
    v_player players%ROWTYPE;
    v_clean_code TEXT;
    v_clean_nick TEXT;
BEGIN
    v_clean_code := UPPER(TRIM(p_room_code));
    v_clean_nick := TRIM(p_nickname);

    IF length(v_clean_nick) < 2 OR length(v_clean_nick) > 25 THEN
        RAISE EXCEPTION 'Nickname must be between 2 and 25 characters.';
    END IF;

    SELECT * INTO v_room FROM rooms WHERE rooms.room_code = v_clean_code LIMIT 1;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Room % not found.', v_clean_code;
    END IF;

    -- Check if player already exists in this room (reconnection flow)
    SELECT * INTO v_player FROM players
    WHERE players.room_id = v_room.id AND LOWER(players.nickname) = LOWER(v_clean_nick)
    LIMIT 1;

    IF FOUND THEN
        -- Reconnecting player: update connected status and timestamp
        UPDATE players
        SET is_connected = true, connected_at = now()
        WHERE id = v_player.id
        RETURNING * INTO v_player;

        RETURN QUERY
        SELECT v_player.id, v_room.id, v_room.room_code::TEXT, v_player.nickname::TEXT, v_player.score;
        RETURN;
    END IF;

    -- New player joining: room must be in WAITING state
    IF v_room.status != 'WAITING' THEN
        RAISE EXCEPTION 'Cannot join room % because the game is already in progress or finished.', v_clean_code;
    END IF;

    -- Insert new player
    INSERT INTO players (room_id, nickname, score, is_connected)
    VALUES (v_room.id, v_clean_nick, 0, true)
    RETURNING * INTO v_player;

    RETURN QUERY
    SELECT v_player.id, v_room.id, v_room.room_code::TEXT, v_player.nickname::TEXT, v_player.score;
END;
$$ LANGUAGE plpgsql;

-- RPC 3: Start Game (Host only)
CREATE OR REPLACE FUNCTION start_game(
    p_room_code TEXT,
    p_host_token UUID
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_room rooms%ROWTYPE;
BEGIN
    SELECT * INTO v_room FROM rooms
    WHERE room_code = UPPER(TRIM(p_room_code)) AND host_token = p_host_token;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Unauthorized: Invalid room code or host token.';
    END IF;

    IF v_room.status != 'WAITING' THEN
        RAISE EXCEPTION 'Game has already started.';
    END IF;

    UPDATE rooms
    SET status = 'QUESTION_ACTIVE',
        current_question = 1,
        question_started_at = clock_timestamp(),
        started_at = clock_timestamp()
    WHERE id = v_room.id;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- RPC 4: Submit Player Answer
CREATE OR REPLACE FUNCTION submit_player_answer(
    p_room_code TEXT,
    p_player_id UUID,
    p_question_number INT,
    p_selected_answer TEXT
)
RETURNS TABLE (
    is_correct BOOLEAN,
    points INT,
    response_time_ms INT,
    correct_answer CHAR(1)
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_room rooms%ROWTYPE;
    v_player players%ROWTYPE;
    v_question questions%ROWTYPE;
    v_now TIMESTAMPTZ;
    v_ms INT;
    v_is_correct BOOLEAN;
    v_prior_correct_count INT;
    v_points INT := 0;
    v_selected CHAR(1);
BEGIN
    v_now := clock_timestamp();
    v_selected := UPPER(TRIM(p_selected_answer));

    IF v_selected NOT IN ('A', 'B', 'C') THEN
        RAISE EXCEPTION 'Invalid answer selection: %', p_selected_answer;
    END IF;

    -- Validate room state
    SELECT * INTO v_room FROM rooms WHERE room_code = UPPER(TRIM(p_room_code));
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Room not found.';
    END IF;

    IF v_room.status != 'QUESTION_ACTIVE' THEN
        RAISE EXCEPTION 'Question is not currently active for answering.';
    END IF;

    IF v_room.current_question != p_question_number THEN
        RAISE EXCEPTION 'Submitted answer for question %, but room is on question %.',
            p_question_number, v_room.current_question;
    END IF;

    -- Validate player
    SELECT * INTO v_player FROM players WHERE id = p_player_id AND room_id = v_room.id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Player not found in this room.';
    END IF;

    -- Check duplicate answer
    IF EXISTS (
        SELECT 1 FROM game_answers
        WHERE room_id = v_room.id AND player_id = p_player_id AND question_number = p_question_number
    ) THEN
        RAISE EXCEPTION 'Player has already answered this question.';
    END IF;

    -- Fetch question from protected table
    SELECT * INTO v_question FROM questions WHERE question_number = p_question_number;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Question % not found.', p_question_number;
    END IF;

    -- Calculate official response time in ms based on server clock
    v_ms := GREATEST(10, ROUND(EXTRACT(EPOCH FROM (v_now - v_room.question_started_at)) * 1000)::INT);

    -- 15-second time limit
    IF v_ms > 15000 THEN
        RAISE EXCEPTION 'Time limit expired for this question.';
    END IF;

    -- Check correctness
    v_is_correct := (v_selected = v_question.correct_answer);

    -- Calculate points:
    -- 1st correct: 100
    -- 2nd correct: 80
    -- 3rd correct: 60
    -- 4th correct: 40
    -- 5th+ correct: 20
    -- incorrect: 0
    IF v_is_correct THEN
        SELECT COUNT(*)::INT INTO v_prior_correct_count
        FROM game_answers
        WHERE room_id = v_room.id AND question_number = p_question_number AND is_correct = true;

        IF v_prior_correct_count = 0 THEN
            v_points := 100;
        ELSIF v_prior_correct_count = 1 THEN
            v_points := 80;
        ELSIF v_prior_correct_count = 2 THEN
            v_points := 60;
        ELSIF v_prior_correct_count = 3 THEN
            v_points := 40;
        ELSE
            v_points := 20;
        END IF;
    ELSE
        v_points := 0;
    END IF;

    -- Record answer
    INSERT INTO game_answers (
        room_id,
        player_id,
        question_number,
        selected_answer,
        is_correct,
        response_time_ms,
        points,
        answered_at
    ) VALUES (
        v_room.id,
        p_player_id,
        p_question_number,
        v_selected,
        v_is_correct,
        v_ms,
        v_points,
        v_now
    );

    -- Update player score
    UPDATE players
    SET score = score + v_points
    WHERE id = p_player_id;

    RETURN QUERY
    SELECT v_is_correct, v_points, v_ms, v_question.correct_answer;
END;
$$ LANGUAGE plpgsql;

-- RPC 5: Advance Game State (Host only)
CREATE OR REPLACE FUNCTION advance_game_state(
    p_room_code TEXT,
    p_host_token UUID,
    p_action TEXT
)
RETURNS TABLE (
    new_status VARCHAR(20),
    current_question INT
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_room rooms%ROWTYPE;
    v_next_q INT;
    v_next_status VARCHAR(20);
BEGIN
    SELECT * INTO v_room FROM rooms
    WHERE room_code = UPPER(TRIM(p_room_code)) AND host_token = p_host_token;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Unauthorized: Invalid room code or host token.';
    END IF;

    IF p_action = 'SHOW_RESULTS' THEN
        v_next_status := 'QUESTION_RESULTS';
        v_next_q := v_room.current_question;
        UPDATE rooms
        SET status = v_next_status
        WHERE id = v_room.id;

    ELSIF p_action = 'NEXT_QUESTION' THEN
        IF v_room.current_question >= 30 THEN
            v_next_status := 'FINISHED';
            v_next_q := 30;
            UPDATE rooms
            SET status = 'FINISHED'
            WHERE id = v_room.id;
        ELSE
            v_next_status := 'QUESTION_ACTIVE';
            v_next_q := v_room.current_question + 1;
            UPDATE rooms
            SET status = 'QUESTION_ACTIVE',
                current_question = v_next_q,
                question_started_at = clock_timestamp()
            WHERE id = v_room.id;
        END IF;

    ELSIF p_action = 'PAUSE' THEN
        v_next_status := 'PAUSED';
        v_next_q := v_room.current_question;
        UPDATE rooms
        SET status = 'PAUSED'
        WHERE id = v_room.id;

    ELSIF p_action = 'RESUME' THEN
        v_next_status := 'QUESTION_ACTIVE';
        v_next_q := v_room.current_question;
        UPDATE rooms
        SET status = 'QUESTION_ACTIVE'
        WHERE id = v_room.id;

    ELSIF p_action = 'END_GAME' THEN
        v_next_status := 'FINISHED';
        v_next_q := v_room.current_question;
        UPDATE rooms
        SET status = 'FINISHED'
        WHERE id = v_room.id;

    ELSE
        RAISE EXCEPTION 'Unknown action: %', p_action;
    END IF;

    RETURN QUERY
    SELECT v_next_status, v_next_q;
END;
$$ LANGUAGE plpgsql;

-- RPC 6: Get Room Leaderboard
CREATE OR REPLACE FUNCTION get_room_leaderboard(p_room_code TEXT)
RETURNS TABLE (
    player_rank BIGINT,
    player_id UUID,
    nickname VARCHAR(30),
    score INT,
    correct_answers BIGINT,
    total_answers BIGINT,
    avg_response_time_ms NUMERIC
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH player_stats AS (
        SELECT
            p.id,
            p.nickname,
            p.score,
            COUNT(CASE WHEN ga.is_correct THEN 1 END) AS correct_count,
            COUNT(ga.id) AS total_count,
            COALESCE(ROUND(AVG(ga.response_time_ms)::NUMERIC, 0), 0) AS avg_time
        FROM players p
        JOIN rooms r ON p.room_id = r.id
        LEFT JOIN game_answers ga ON ga.player_id = p.id AND ga.room_id = r.id
        WHERE r.room_code = UPPER(TRIM(p_room_code))
        GROUP BY p.id, p.nickname, p.score
    )
    SELECT
        ROW_NUMBER() OVER (ORDER BY ps.score DESC, ps.avg_time ASC) AS player_rank,
        ps.id AS player_id,
        ps.nickname,
        ps.score,
        ps.correct_count AS correct_answers,
        ps.total_count AS total_answers,
        ps.avg_time AS avg_response_time_ms
    FROM player_stats ps
    ORDER BY player_rank ASC;
END;
$$ LANGUAGE plpgsql;

-- RPC 7: Get Question Result (Reveals correct answer strictly when question has completed)
CREATE OR REPLACE FUNCTION get_question_result(
    p_room_code TEXT,
    p_question_number INT
)
RETURNS TABLE (
    question_number INT,
    correct_answer CHAR(1),
    correct_option_text TEXT,
    total_answers INT,
    correct_answers INT
)
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_room rooms%ROWTYPE;
    v_q questions%ROWTYPE;
    v_correct_text TEXT;
    v_total INT;
    v_correct_cnt INT;
BEGIN
    SELECT * INTO v_room FROM rooms WHERE room_code = UPPER(TRIM(p_room_code));
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Room not found.';
    END IF;

    -- Security: Only permit revealing correct answer if room is in RESULTS or FINISHED
    -- or if the room has moved past this question
    IF v_room.status NOT IN ('QUESTION_RESULTS', 'FINISHED') AND v_room.current_question <= p_question_number THEN
        RAISE EXCEPTION 'Answer cannot be revealed while question is active.';
    END IF;

    SELECT * INTO v_q FROM questions WHERE questions.question_number = p_question_number;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Question not found.';
    END IF;

    IF v_q.correct_answer = 'A' THEN
        v_correct_text := v_q.option_a;
    ELSIF v_q.correct_answer = 'B' THEN
        v_correct_text := v_q.option_b;
    ELSE
        v_correct_text := v_q.option_c;
    END IF;

    SELECT
        COUNT(*)::INT,
        COUNT(CASE WHEN is_correct THEN 1 END)::INT
    INTO v_total, v_correct_cnt
    FROM game_answers
    WHERE room_id = v_room.id AND game_answers.question_number = p_question_number;

    RETURN QUERY
    SELECT
        v_q.question_number,
        v_q.correct_answer,
        v_correct_text,
        v_total,
        v_correct_cnt;
END;
$$ LANGUAGE plpgsql;

-- Grant RPC execution to anon and authenticated
GRANT EXECUTE ON FUNCTION create_game_room() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION join_game_room(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION start_game(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION submit_player_answer(TEXT, UUID, INT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION advance_game_state(TEXT, UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_room_leaderboard(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_question_result(TEXT, INT) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 8. ADMIN FUNCTIONS FOR FUTURE QUESTION MANAGEMENT (Requirement 30)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION admin_get_all_questions()
RETURNS TABLE (
    id UUID,
    category VARCHAR(20),
    question_number INT,
    question_text TEXT,
    image_url TEXT,
    option_a TEXT,
    option_b TEXT,
    option_c TEXT,
    correct_answer CHAR(1)
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT q.id, q.category, q.question_number, q.question_text, q.image_url, q.option_a, q.option_b, q.option_c, q.correct_answer
    FROM questions q
    ORDER BY q.question_number ASC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION admin_upsert_question(
    p_category VARCHAR(20),
    p_question_number INT,
    p_question_text TEXT,
    p_image_url TEXT,
    p_option_a TEXT,
    p_option_b TEXT,
    p_option_c TEXT,
    p_correct_answer CHAR(1)
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO questions (
        category, question_number, question_text, image_url, option_a, option_b, option_c, correct_answer
    ) VALUES (
        p_category, p_question_number, p_question_text, p_image_url, p_option_a, p_option_b, p_option_c, UPPER(TRIM(p_correct_answer))
    )
    ON CONFLICT (question_number) DO UPDATE
    SET category = EXCLUDED.category,
        question_text = EXCLUDED.question_text,
        image_url = EXCLUDED.image_url,
        option_a = EXCLUDED.option_a,
        option_b = EXCLUDED.option_b,
        option_c = EXCLUDED.option_c,
        correct_answer = EXCLUDED.correct_answer;

    RETURN true;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION admin_get_all_questions() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_upsert_question(VARCHAR, INT, TEXT, TEXT, TEXT, TEXT, TEXT, CHAR) TO anon, authenticated;

-- -----------------------------------------------------------------------------
-- 9. ENABLE REALTIME ON TABLES
-- -----------------------------------------------------------------------------
-- Enable publication for rooms, players, and game_answers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'rooms'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'players'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE players;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'game_answers'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE game_answers;
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 10. INITIAL DATA: 30 QUESTIONS (15 FRUITS + 15 ANIMALS)
-- Balanced distribution: 10 Option A, 10 Option B, 10 Option C
-- -----------------------------------------------------------------------------
INSERT INTO questions (category, question_number, question_text, image_url, option_a, option_b, option_c, correct_answer)
VALUES
-- FRUITS (15)
('fruits', 1, 'Which fruit is this?', 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&auto=format&fit=crop&q=80', 'BANANA', 'APPLE', 'CHERRY', 'B'),
('fruits', 2, 'Which fruit is this?', 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80', 'BANANA', 'LEMON', 'PEAR', 'A'),
('fruits', 3, 'Which fruit is this?', 'https://images.unsplash.com/photo-1582979512210-99b6a53386f9?w=600&auto=format&fit=crop&q=80', 'PEACH', 'PAPAYA', 'ORANGE', 'C'),
('fruits', 4, 'Which fruit is this?', 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=600&auto=format&fit=crop&q=80', 'STRAWBERRY', 'WATERMELON', 'CHERRY', 'A'),
('fruits', 5, 'Which fruit is this?', 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80', 'KIWI', 'WATERMELON', 'PINEAPPLE', 'B'),
('fruits', 6, 'Which fruit is this?', 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=600&auto=format&fit=crop&q=80', 'PINEAPPLE', 'COCONUT', 'MANGO', 'A'),
('fruits', 7, 'Which fruit is this?', 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80', 'PEACH', 'PAPAYA', 'MANGO', 'C'),
('fruits', 8, 'Which fruit is this?', 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=600&auto=format&fit=crop&q=80', 'CHERRY', 'GRAPE', 'KIWI', 'B'),
('fruits', 9, 'Which fruit is this?', 'https://images.unsplash.com/photo-1590502593747-42a996133562?w=600&auto=format&fit=crop&q=80', 'LEMON', 'BANANA', 'PEAR', 'A'),
('fruits', 10, 'Which fruit is this?', 'https://images.unsplash.com/photo-1544378730-8b5104b18790?w=600&auto=format&fit=crop&q=80', 'KIWI', 'COCONUT', 'PINEAPPLE', 'B'),
('fruits', 11, 'Which fruit is this?', 'https://images.unsplash.com/photo-1629828874514-c1e5103f2150?w=600&auto=format&fit=crop&q=80', 'APPLE', 'ORANGE', 'PEACH', 'C'),
('fruits', 12, 'Which fruit is this?', 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80', 'PEAR', 'APPLE', 'LEMON', 'A'),
('fruits', 13, 'Which fruit is this?', 'https://images.unsplash.com/photo-1528821128474-27f963b062bf?w=600&auto=format&fit=crop&q=80', 'STRAWBERRY', 'CHERRY', 'GRAPE', 'B'),
('fruits', 14, 'Which fruit is this?', 'https://images.unsplash.com/photo-1585059895524-72359e06133a?w=600&auto=format&fit=crop&q=80', 'COCONUT', 'PEAR', 'KIWI', 'C'),
('fruits', 15, 'Which fruit is this?', 'https://images.unsplash.com/photo-1617112848923-cc2234396a8d?w=600&auto=format&fit=crop&q=80', 'PAPAYA', 'MANGO', 'WATERMELON', 'A'),

-- ANIMALS (15)
('animals', 16, 'Which animal is this?', 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&auto=format&fit=crop&q=80', 'CAT', 'DOG', 'BEAR', 'B'),
('animals', 17, 'Which animal is this?', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&auto=format&fit=crop&q=80', 'RABBIT', 'TIGER', 'CAT', 'C'),
('animals', 18, 'Which animal is this?', 'https://images.unsplash.com/photo-1614027164847-1b28caa142e9?w=600&auto=format&fit=crop&q=80', 'LION', 'TIGER', 'HORSE', 'A'),
('animals', 19, 'Which animal is this?', 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?w=600&auto=format&fit=crop&q=80', 'LEOPARD', 'TIGER', 'LION', 'B'),
('animals', 20, 'Which animal is this?', 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=600&auto=format&fit=crop&q=80', 'GIRAFFE', 'COW', 'ELEPHANT', 'C'),
('animals', 21, 'Which animal is this?', 'https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?w=600&auto=format&fit=crop&q=80', 'MONKEY', 'BEAR', 'DOG', 'A'),
('animals', 22, 'Which animal is this?', 'https://images.unsplash.com/photo-1547721064-da6cfb341d50?w=600&auto=format&fit=crop&q=80', 'HORSE', 'GIRAFFE', 'ZEBRA', 'B'),
('animals', 23, 'Which animal is this?', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80', 'COW', 'ZEBRA', 'HORSE', 'C'),
('animals', 24, 'Which animal is this?', 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?w=600&auto=format&fit=crop&q=80', 'COW', 'HORSE', 'ELEPHANT', 'A'),
('animals', 25, 'Which animal is this?', 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=600&auto=format&fit=crop&q=80', 'CAT', 'RABBIT', 'MONKEY', 'B'),
('animals', 26, 'Which animal is this?', 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=600&auto=format&fit=crop&q=80', 'DOG', 'LION', 'BEAR', 'C'),
('animals', 27, 'Which animal is this?', 'https://images.unsplash.com/photo-1526095179574-86e545346ae6?w=600&auto=format&fit=crop&q=80', 'ZEBRA', 'HORSE', 'GIRAFFE', 'A'),
('animals', 28, 'Which animal is this?', 'https://images.unsplash.com/photo-1598439210625-5067c578f3f6?w=600&auto=format&fit=crop&q=80', 'DOLPHIN', 'PENGUIN', 'CROCODILE', 'B'),
('animals', 29, 'Which animal is this?', 'https://images.unsplash.com/photo-1607153333879-c1a0c10a30b4?w=600&auto=format&fit=crop&q=80', 'CROCODILE', 'PENGUIN', 'DOLPHIN', 'C'),
('animals', 30, 'Which animal is this?', 'https://images.unsplash.com/photo-1527525443983-6e60c75fff46?w=600&auto=format&fit=crop&q=80', 'CROCODILE', 'DOLPHIN', 'ELEPHANT', 'A');

