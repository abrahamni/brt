UPDATE
    user_tokens
SET
    expires_at = to_timestamp(0)
WHERE
    token = $1