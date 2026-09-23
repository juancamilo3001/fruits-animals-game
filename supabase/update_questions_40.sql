-- =============================================================================
-- ACTUALIZACIÓN: 40 PREGUNTAS (20 FRUTAS + 20 ANIMALES INTERCALADAS)
-- Frutas en preguntas impares (1,3,5,...,39)
-- Animales en preguntas pares (2,4,6,...,40)
-- Preguntas en ESPAÑOL — Opciones en INGLÉS — Sin imágenes
-- =============================================================================
-- IMPORTANTE: NO usa DROP TABLE. Solo actualiza preguntas y la función
--             advance_game_state para el nuevo límite de 40 preguntas.
-- =============================================================================

-- Paso 1: Eliminar las preguntas existentes (30 antiguas)
DELETE FROM questions;

-- Paso 2: Insertar las 40 nuevas preguntas
-- image_url se deja como cadena vacía (columna NOT NULL, se ignora en la UI)
INSERT INTO questions (category, question_number, question_text, image_url, option_a, option_b, option_c, correct_answer) VALUES
('fruits',  1,  '¿Cómo se dice "manzana" en inglés?',    '', 'APPLE',       'BANANA',     'ORANGE',     'A'),
('animals', 2,  '¿Cómo se dice "perro" en inglés?',      '', 'CAT',         'DOG',        'HORSE',      'B'),
('fruits',  3,  '¿Cómo se dice "banana" en inglés?',     '', 'MANGO',       'PEAR',       'BANANA',     'C'),
('animals', 4,  '¿Cómo se dice "gato" en inglés?',       '', 'CAT',         'RABBIT',     'HAMSTER',    'A'),
('fruits',  5,  '¿Cómo se dice "naranja" en inglés?',    '', 'LEMON',       'ORANGE',     'CHERRY',     'B'),
('animals', 6,  '¿Cómo se dice "caballo" en inglés?',    '', 'DONKEY',      'ZEBRA',      'HORSE',      'C'),
('fruits',  7,  '¿Cómo se dice "fresa" en inglés?',      '', 'STRAWBERRY',  'RASPBERRY',  'GRAPE',      'A'),
('animals', 8,  '¿Cómo se dice "vaca" en inglés?',       '', 'COW',         'GOAT',       'SHEEP',      'A'),
('fruits',  9,  '¿Cómo se dice "sandía" en inglés?',     '', 'MELON',       'PINEAPPLE',  'WATERMELON', 'C'),
('animals', 10, '¿Cómo se dice "elefante" en inglés?',   '', 'HIPPO',       'RHINO',      'ELEPHANT',   'C'),
('fruits',  11, '¿Cómo se dice "piña" en inglés?',       '', 'COCONUT',     'PINEAPPLE',  'MANGO',      'B'),
('animals', 12, '¿Cómo se dice "león" en inglés?',       '', 'LION',        'TIGER',      'CHEETAH',    'A'),
('fruits',  13, '¿Cómo se dice "uva" en inglés?',        '', 'PLUM',        'BLUEBERRY',  'GRAPE',      'C'),
('animals', 14, '¿Cómo se dice "tigre" en inglés?',      '', 'LEOPARD',     'JAGUAR',     'TIGER',      'C'),
('fruits',  15, '¿Cómo se dice "mango" en inglés?',      '', 'MANGO',       'PEACH',      'PAPAYA',     'A'),
('animals', 16, '¿Cómo se dice "mono" en inglés?',       '', 'GORILLA',     'MONKEY',     'CHIMPANZEE', 'B'),
('fruits',  17, '¿Cómo se dice "pera" en inglés?',       '', 'APPLE',       'PEAR',       'KIWI',       'B'),
('animals', 18, '¿Cómo se dice "conejo" en inglés?',     '', 'HAMSTER',     'SQUIRREL',   'RABBIT',     'C'),
('fruits',  19, '¿Cómo se dice "limón" en inglés?',      '', 'LEMON',       'LIME',       'ORANGE',     'A'),
('animals', 20, '¿Cómo se dice "oso" en inglés?',        '', 'BEAR',        'WOLF',       'FOX',        'A'),
('fruits',  21, '¿Cómo se dice "melón" en inglés?',      '', 'WATERMELON',  'MANGO',      'MELON',      'C'),
('animals', 22, '¿Cómo se dice "jirafa" en inglés?',     '', 'CAMEL',       'GIRAFFE',    'ZEBRA',      'B'),
('fruits',  23, '¿Cómo se dice "durazno" en inglés?',    '', 'APRICOT',     'PLUM',       'PEACH',      'C'),
('animals', 24, '¿Cómo se dice "cebra" en inglés?',      '', 'HORSE',       'DONKEY',     'ZEBRA',      'C'),
('fruits',  25, '¿Cómo se dice "cereza" en inglés?',     '', 'CHERRY',      'BLUEBERRY',  'RASPBERRY',  'A'),
('animals', 26, '¿Cómo se dice "delfín" en inglés?',     '', 'SHARK',       'DOLPHIN',    'WHALE',      'B'),
('fruits',  27, '¿Cómo se dice "coco" en inglés?',       '', 'ALMOND',      'COCONUT',    'WALNUT',     'B'),
('animals', 28, '¿Cómo se dice "tiburón" en inglés?',    '', 'SHARK',       'RAY',        'ORCA',       'A'),
('fruits',  29, '¿Cómo se dice "papaya" en inglés?',     '', 'GUAVA',       'LYCHEE',     'PAPAYA',     'C'),
('animals', 30, '¿Cómo se dice "águila" en inglés?',     '', 'HAWK',        'CONDOR',     'EAGLE',      'C'),
('fruits',  31, '¿Cómo se dice "kiwi" en inglés?',       '', 'KIWI',        'FIG',        'AVOCADO',    'A'),
('animals', 32, '¿Cómo se dice "serpiente" en inglés?',  '', 'LIZARD',      'SNAKE',      'CROCODILE',  'B'),
('fruits',  33, '¿Cómo se dice "mandarina" en inglés?',  '', 'LEMON',       'ORANGE',     'TANGERINE',  'C'),
('animals', 34, '¿Cómo se dice "tortuga" en inglés?',    '', 'TURTLE',      'FROG',       'LIZARD',     'A'),
('fruits',  35, '¿Cómo se dice "ciruela" en inglés?',    '', 'PLUM',        'APRICOT',    'CHERRY',     'A'),
('animals', 36, '¿Cómo se dice "lobo" en inglés?',       '', 'FOX',         'WOLF',       'DOG',        'B'),
('fruits',  37, '¿Cómo se dice "granada" en inglés?',    '', 'POMEGRANATE', 'RASPBERRY',  'STRAWBERRY', 'A'),
('animals', 38, '¿Cómo se dice "zorro" en inglés?',      '', 'FOX',         'RACCOON',    'COYOTE',     'A'),
('fruits',  39, '¿Cómo se dice "frambuesa" en inglés?',  '', 'BLUEBERRY',   'RASPBERRY',  'BLACKBERRY', 'B'),
('animals', 40, '¿Cómo se dice "pingüino" en inglés?',   '', 'PENGUIN',     'SEAL',       'SEA LION',   'A');

-- =============================================================================
-- Paso 3: Actualizar advance_game_state para el límite de 40 preguntas
-- =============================================================================
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
        RAISE EXCEPTION 'No autorizado: código de sala o token de host inválido.';
    END IF;

    IF p_action = 'SHOW_RESULTS' THEN
        v_next_status := 'QUESTION_RESULTS';
        v_next_q := v_room.current_question;
        UPDATE rooms SET status = v_next_status WHERE id = v_room.id;

    ELSIF p_action = 'NEXT_QUESTION' THEN
        IF v_room.current_question >= 40 THEN
            v_next_status := 'FINISHED';
            v_next_q := 40;
            UPDATE rooms SET status = 'FINISHED' WHERE id = v_room.id;
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
        UPDATE rooms SET status = 'PAUSED' WHERE id = v_room.id;

    ELSIF p_action = 'RESUME' THEN
        v_next_status := 'QUESTION_ACTIVE';
        v_next_q := v_room.current_question;
        -- Al reanudar, reiniciamos question_started_at desde el momento actual
        UPDATE rooms
        SET status = 'QUESTION_ACTIVE',
            question_started_at = clock_timestamp()
        WHERE id = v_room.id;

    ELSIF p_action = 'END_GAME' THEN
        v_next_status := 'FINISHED';
        v_next_q := v_room.current_question;
        UPDATE rooms SET status = 'FINISHED' WHERE id = v_room.id;

    ELSE
        RAISE EXCEPTION 'Acción desconocida: %', p_action;
    END IF;

    RETURN QUERY SELECT v_next_status, v_next_q;
END;
$$ LANGUAGE plpgsql;

-- Verificación:
-- SELECT COUNT(*) FROM questions;                           => 40
-- SELECT COUNT(*) FROM questions WHERE category='fruits';  => 20
-- SELECT COUNT(*) FROM questions WHERE category='animals'; => 20
