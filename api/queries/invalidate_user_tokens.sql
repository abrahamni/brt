UPDATE
    user_tokens
SET
    expires_at = to_timestamp(0)
WHERE
    token_type = $1 AND user_id = $2