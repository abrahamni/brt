SELECT 
    name 
FROM 
    generic_status_translations 
WHERE 
    status_id = $1
LIMIT 
    1;