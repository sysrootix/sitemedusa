-- SQL queries to examine vacancies and vacancy_responses tables

-- Check vacancies table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM
    information_schema.columns
WHERE
    table_name = 'vacancies'
ORDER BY
    ordinal_position;

-- Check vacancy_responses table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM
    information_schema.columns
WHERE
    table_name = 'vacancy_responses'
ORDER BY
    ordinal_position;

-- Sample data from vacancies (if exists)
SELECT * FROM vacancies LIMIT 5;

-- Sample data from vacancy_responses (if exists)
SELECT * FROM vacancy_responses LIMIT 5;
