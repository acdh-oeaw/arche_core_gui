-- check the smartsearch cache table 
CREATE TABLE IF NOT EXISTS gui.search_cache (
    hash text NOT NULL,
    response text NOT NULL,
    created timestamp without time zone NOT NULL,
    requested timestamp without time zone NOT NULL
);

grant select, insert, update, delete on gui.search_cache to gui;