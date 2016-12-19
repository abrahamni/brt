INSERT INTO user_tokens 
    ( token_type, user_id, token ) 
VALUES 
    ( $1, $2, $3 );