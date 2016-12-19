SELECT
    fio.id,
    fio.form_id,
    fio.section_id,
    fio.item_id,
    fio.settings,
    fio.sort_order,
    fiot.label,
    (SELECT COUNT(id) FROM form_response_items WHERE option_id = fio.id) AS responses_count
FROM
    form_item_options AS fio
        INNER JOIN form_item_option_translations AS fiot
            ON fio.id = fiot.option_id AND fiot.lang = $1
WHERE
    fio.form_id = $2 AND 
    ($3::BIGINT IS NULL OR $3::BIGINT = fio.item_id)
ORDER BY
    fio.sort_order, fio.item_id, fio.id