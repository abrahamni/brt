SELECT 
    fit.item_id,
    jsonb_agg(fit.*) AS translations
FROM 
    form_item_translations AS fit
        INNER JOIN form_items AS fi
            ON fit.item_id = fi.id
WHERE
    fi.form_id = $1
GROUP BY
    item_id
ORDER BY
    item_id;