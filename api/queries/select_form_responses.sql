SELECT
    fr.id AS response_id,
    fr.datetime,
    (SELECT name FROM generic_statuses WHERE id = fr.status LIMIT 1) AS status,
    jsonb_agg(responses_items ORDER BY item_id) AS items
FROM
    form_responses AS fr
        INNER JOIN (
            SELECT
                fri.response_id,
                fri.item_id,
                fit.label AS item_label,
                fit.description AS item_description,
                fit.note AS item_note,
                fitp.name AS item_type,
                fi.settings AS item_settings,
                fri.option_id,
                fio.settings AS option_settings,
                fiot.label AS option_label,
                (CASE 
                    WHEN fio.value::TEXT IS NOT NULL THEN fio.value
                    WHEN fri.value::TEXT IS NOT NULL THEN fri.value
                    ELSE frit.value END
                ) AS value
            FROM
                form_response_items AS fri
                    LEFT JOIN form_response_item_translations AS frit
                        ON fri.id = frit.response_item_id AND frit.lang = $1
                    INNER JOIN form_items AS fi
                        ON fri.item_id = fi.id
                    INNER JOIN form_item_types AS fitp
                        ON fi.type = fitp.id
                    LEFT JOIN form_item_translations AS fit
                        ON fi.id = fit.item_id AND fit.lang = $1
                    LEFT JOIN form_item_options AS fio
                        ON fri.option_id = fio.id
                    LEFT JOIN form_item_option_translations AS fiot
                        ON fio.id = fiot.option_id AND fiot.lang = $1
            WHERE
                fri.form_id = $2
        ) AS responses_items ON fr.id = responses_items.response_id
WHERE
    fr.form_id = $2 AND 
    fr.status != -1 AND
    ($3::DATE IS NULL OR fr.datetime >= $3::DATE) AND 
    ($4::DATE IS NULL OR fr.datetime <= $4::DATE) AND
    ($5::BIGINT IS NULL OR $5::BIGINT = fr.status) AND 
    ($6::BIGINT IS NULL OR $6::BIGINT = fr.id)
GROUP BY
    fr.id, fr.datetime
ORDER BY
    fr.datetime DESC, fr.id DESC