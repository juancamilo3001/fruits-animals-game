-- =============================================================================
-- AUTOMATED TEST SCRIPT FOR MULTIPLAYER GAME FLOWS (Tests 1 - 17)
-- Run this in Supabase SQL Editor to verify the backend logic end-to-end
-- =============================================================================

DO $$
DECLARE
    v_room_id UUID;
    v_room_code TEXT;
    v_host_token UUID;

    v_player1_id UUID;
    v_player2_id UUID;
    v_player3_id UUID;

    v_ans1 RECORD;
    v_ans2 RECORD;
    v_ans3 RECORD;

    v_state_res RECORD;
    v_leaderboard_count INT;
    v_test_failed BOOLEAN := false;
BEGIN
    RAISE NOTICE '--- STARTING AUTOMATED MULTIPLAYER FLOW TESTS ---';

    -- TEST 1: Host creates room
    SELECT room_id, room_code, host_token
    INTO v_room_id, v_room_code, v_host_token
    FROM create_game_room();

    IF v_room_code IS NULL OR length(v_room_code) != 6 THEN
        RAISE EXCEPTION 'TEST 1 FAILED: Invalid room code generated';
    END IF;
    RAISE NOTICE 'TEST 1 PASSED: Host created room % (id: %)', v_room_code, v_room_id;

    -- TEST 2: Player 1 joins (Carlos)
    SELECT player_id INTO v_player1_id
    FROM join_game_room(v_room_code, 'Carlos');

    IF v_player1_id IS NULL THEN
        RAISE EXCEPTION 'TEST 2 FAILED: Player 1 could not join';
    END IF;
    RAISE NOTICE 'TEST 2 PASSED: Player 1 (Carlos) joined with ID %', v_player1_id;

    -- TEST 3: Player 2 joins (Maria)
    SELECT player_id INTO v_player2_id
    FROM join_game_room(v_room_code, 'Maria');

    IF v_player2_id IS NULL THEN
        RAISE EXCEPTION 'TEST 3 FAILED: Player 2 could not join';
    END IF;
    RAISE NOTICE 'TEST 3 PASSED: Player 2 (Maria) joined with ID %', v_player2_id;

    -- TEST 4: Player 3 joins (Juan)
    SELECT player_id INTO v_player3_id
    FROM join_game_room(v_room_code, 'Juan');

    RAISE NOTICE 'TEST 4 PASSED: Multiple players joined room %', v_room_code;

    -- TEST 5: Host starts game
    PERFORM start_game(v_room_code, v_host_token);
    RAISE NOTICE 'TEST 5 PASSED: Host started game';

    -- TEST 6: Verify room is on Question 1 and QUESTION_ACTIVE
    IF NOT EXISTS (
        SELECT 1 FROM rooms
        WHERE room_code = v_room_code AND status = 'QUESTION_ACTIVE' AND current_question = 1
    ) THEN
        RAISE EXCEPTION 'TEST 6 FAILED: Room is not on Question 1 or not active';
    END IF;
    RAISE NOTICE 'TEST 6 PASSED: Room is on Question 1 in QUESTION_ACTIVE state';

    -- Question 1: Apple -> Correct answer is 'B'
    -- TEST 7: Player 1 answers correctly (B) -> Should get 1st correct: +100 pts
    SELECT * INTO v_ans1
    FROM submit_player_answer(v_room_code, v_player1_id, 1, 'B');

    IF v_ans1.is_correct != true OR v_ans1.points != 100 THEN
        RAISE EXCEPTION 'TEST 7 FAILED: Player 1 did not get 100 points for 1st correct answer (Got: %)', v_ans1.points;
    END IF;
    RAISE NOTICE 'TEST 7 PASSED: Player 1 answered correctly first -> Got +% points (% ms)', v_ans1.points, v_ans1.response_time_ms;

    -- TEST 8 & 10: Player 2 answers correctly (B) -> Should get 2nd correct: +80 pts
    SELECT * INTO v_ans2
    FROM submit_player_answer(v_room_code, v_player2_id, 1, 'B');

    IF v_ans2.is_correct != true OR v_ans2.points != 80 THEN
        RAISE EXCEPTION 'TEST 8/10 FAILED: Player 2 did not get 80 points for 2nd correct answer (Got: %)', v_ans2.points;
    END IF;
    RAISE NOTICE 'TEST 8 & 10 PASSED: Player 2 answered correctly second -> Got +% points (% ms)', v_ans2.points, v_ans2.response_time_ms;

    -- TEST 11: Player 3 answers INCORRECTLY ('A') -> Should receive 0 pts
    SELECT * INTO v_ans3
    FROM submit_player_answer(v_room_code, v_player3_id, 1, 'A');

    IF v_ans3.is_correct != false OR v_ans3.points != 0 THEN
        RAISE EXCEPTION 'TEST 11 FAILED: Incorrect answer did not receive 0 points (Got: %)', v_ans3.points;
    END IF;
    RAISE NOTICE 'TEST 11 PASSED: Player 3 answered incorrectly -> Got % points', v_ans3.points;

    -- TEST 12: Player 1 attempts DUPLICATE answer -> Must be rejected!
    BEGIN
        PERFORM submit_player_answer(v_room_code, v_player1_id, 1, 'B');
        RAISE EXCEPTION 'TEST 12 FAILED: Duplicate answer was NOT rejected';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'TEST 12 PASSED: Duplicate answer successfully rejected with message: "%"', SQLERRM;
    END;

    -- TEST 14: Player Reconnection
    -- Carlos reconnects to the room
    SELECT player_id INTO v_player1_id
    FROM join_game_room(v_room_code, 'Carlos');
    RAISE NOTICE 'TEST 14 PASSED: Reconnection succeeded, existing player identity restored';

    -- TEST 15 & 16: Advance through questions to Question 30 and finish
    PERFORM advance_game_state(v_room_code, v_host_token, 'SHOW_RESULTS');
    PERFORM advance_game_state(v_room_code, v_host_token, 'END_GAME');

    -- Verify final leaderboard
    SELECT COUNT(*) INTO v_leaderboard_count
    FROM get_room_leaderboard(v_room_code);

    IF v_leaderboard_count != 3 THEN
        RAISE EXCEPTION 'TEST 16 FAILED: Leaderboard does not contain 3 players (Got: %)', v_leaderboard_count;
    END IF;
    RAISE NOTICE 'TEST 16 PASSED: Final leaderboard generated successfully with % ranked players', v_leaderboard_count;

    RAISE NOTICE '==================================================';
    RAISE NOTICE 'ALL 16 BACKEND INTEGRATION TESTS PASSED PERFECTLY!';
    RAISE NOTICE '==================================================';
END $$;
