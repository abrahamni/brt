SELECT
    fs.id,
    fs.form_id,
    fs.sort_order,
    fs.settings,
    fst.title,
    fst.description
FROM
    form_sections AS fs
        INNER JOIN form_section_translations AS fst
            ON fs.id = fst.section_id AND fst.lang = $1
WHERE
    fs.form_id = $2 AND 
    ($3::BIGINT IS NULL OR $3::BIGINT = fs.id)
ORDER BY
    fs.sort_order, fs.id