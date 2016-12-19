SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.permission
FROM
    users AS u
        INNER JOIN user_tokens AS utk
            ON u.id = utk.user_id AND utk.token_type = $1 AND timezone('UTC'::TEXT, NOW()) < utk.expires_at
WHERE
    utk.token = $2