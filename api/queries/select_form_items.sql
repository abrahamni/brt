SELECT
    fi.id,
    fi.form_id,
    fi.section_id,
    fi.parent_id,
    tp.name AS type,
    tp.id AS type_id,
    fi.settings,
    fi.sort_order,
    fit.label,
    fit.description,
    fit.note
FROM
    form_items AS fi
        LEFT JOIN form_item_translations AS fit
            ON fi.id = fit.item_id AND fit.lang = $1
        INNER JOIN form_item_types AS tp
            ON fi.type = tp.id
WHERE
    fi.form_id = $2 AND 
    ($3::BIGINT IS NULL OR $3::BIGINT = fi.id)
ORDER BY
    fi.section_id, fi.sort_order, fi.id