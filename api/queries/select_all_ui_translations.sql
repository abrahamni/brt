SELECT
    t_key,
    t_group,
    jsonb_agg(uit.*) AS translations
FROM
    ui_translations AS uit
GROUP BY
    t_key, t_group
ORDER BY
    t_key;