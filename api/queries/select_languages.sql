SELECT 
    code,
    name,
    native_name,
    enabled,
    rtl,
    settings
FROM 
    languages
ORDER BY
    sort_order, name;