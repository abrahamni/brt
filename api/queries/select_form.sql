SELECT 
    f.id,
    f.created_at,
    f.updated_at,
    f.settings,
    t.title,
    t.description
FROM 
    forms AS f 
        LEFT JOIN form_translations AS t 
            ON f.id = t.form_id AND t.lang = $1
WHERE 
    f.status = 1
ORDER BY
    f.sort_order, f.id DESC
LIMIT
    1;