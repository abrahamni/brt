SELECT
    fiot.option_id AS x_axis_id,
    fiot.label AS x_axis_label,
    fri3.option_id AS y_axis_id,
    fri3.label AS y_axis_label,
    count(fri3.value) AS count,
    array_agg(fri3.value) AS values
FROM
    form_response_items AS fri
        LEFT JOIN form_item_option_translations AS fiot
            ON fiot.option_id = fri.option_id AND fiot.lang = $1
        LEFT JOIN (
            SELECT
                fri2.response_id,
                fri2.option_id,
                fiot2.label,
                (CASE 
                    WHEN fri2.value::TEXT IS NOT NULL THEN fri2.value
                    ELSE fio.value END
                ) AS value
            FROM
                form_response_items AS fri2
                    LEFT JOIN form_item_options AS fio
                        ON fri2.option_id = fio.id
                    LEFT JOIN form_item_option_translations AS fiot2
                        ON fri2.option_id = fiot2.option_id AND fiot2.lang = $1
            WHERE
                fri2.response_id IN (
                    SELECT
                        fr2.id AS response_id
                    FROM
                        form_responses AS fr2
                    WHERE
                        fr2.form_id = $2 AND 
                        ($5::DATE IS NULL OR fr2.datetime > $5::DATE) AND 
                        ($6::DATE IS NULL OR fr2.datetime < $6::DATE)
                ) AND fri2.option_id IS NOT NULL AND fri2.item_id = $4
        ) AS fri3 ON fri3.response_id = fri.response_id
WHERE
    fri.response_id IN (
        SELECT
            fr.id AS response_id
        FROM
            form_responses AS fr
        WHERE
            fr.status = 1 AND 
            fr.form_id = $2 AND 
            ($5::DATE IS NULL OR fr.datetime > $5::DATE) AND 
            ($6::DATE IS NULL OR fr.datetime < $6::DATE)
    ) AND fri.option_id IS NOT NULL AND fri.item_id = $3 AND fri3.option_id IS NOT NULL
GROUP BY
    1, 2, 3, 4
ORDER BY
    2, 4;