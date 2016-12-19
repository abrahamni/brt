SELECT
    fio.item_id,
    fiot.option_id,
    jsonb_agg(fiot.*) AS translations
FROM
    form_item_option_translations AS fiot
        LEFT JOIN form_item_options AS fio
            ON fiot.option_id = fio.id
WHERE
    fio.form_id = $1
GROUP BY
    item_id, option_id
ORDER BY
    item_id, option_id;