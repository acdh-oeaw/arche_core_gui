-- check the smartsearch cache table 
CREATE TABLE IF NOT EXISTS gui.search_cache (
    hash text NOT NULL,
    response text NOT NULL,
    created timestamp without time zone NOT NULL,
    requested timestamp without time zone NOT NULL
);

grant select, insert, update, delete on gui.search_cache to gui;


/**
*  Arche Dashboard SQL
**/

/* PROPERTIES */
DROP FUNCTION IF EXISTS gui.dash_properties_func();
CREATE FUNCTION gui.dash_properties_func()
  RETURNS table (property text, count bigint, sumcount bigint)
AS $func$
DECLARE
BEGIN

RETURN QUERY
WITH query_data as (
    SELECT
	mv.property, count(mv.*) as cnt
    from public.metadata_view as mv
    where mv.property is not null
    GROUP BY mv.property
    UNION
    SELECT
	CASE WHEN mv.type = 'ID' THEN 'https://vocabs.acdh.oeaw.ac.at/schema#hasIdentifier' ELSE mv.property END as property, count(mv.*) as cnt
    from public.metadata_view as mv
    where mv.property is null
    GROUP BY mv.property, mv.type
) select qd.property, qd.cnt, (select count(qd2.*) from query_data as qd2) as sumcount from query_data as qd  order by qd.property;
END
$func$
LANGUAGE 'plpgsql';


/* CLASSES PROPERTIES */
DROP FUNCTION IF EXISTS gui.dash_classes_properties_func();
CREATE FUNCTION gui.dash_classes_properties_func()
  RETURNS table (class text, property text, cnt_distinct_value bigint, cnt bigint, sumcount bigint )
AS $func$
DECLARE
BEGIN

RETURN QUERY
    WITH query_data as (
	select
	t_class.value as class, tp.property, count(distinct tp.value) as cnt_distinct_value, count(*) as cnt
        from
	(select mv.id, mv.value
            from public.metadata_view as mv
            where mv.property = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
	) t_class
	inner join public.metadata_view tp on t_class.id =tp.id
        group by t_class.value, tp.property
    ) select qd.class, qd.property, qd.cnt_distinct_value, qd.cnt, (select count(qd2.*) from query_data as qd2) as sumcount from query_data as qd  order by qd.class;
END
$func$
LANGUAGE 'plpgsql';

