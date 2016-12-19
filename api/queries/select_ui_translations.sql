SELECT 
    lang,
    t_key,
    t_value,
    t_group
FROM 
    ui_translations
WHERE
    $1::TEXT IS NULL OR lang = $1::TEXT
ORDER BY
    t_key, lang;