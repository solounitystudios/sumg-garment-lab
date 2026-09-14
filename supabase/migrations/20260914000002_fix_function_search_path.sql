-- Pin search_path on trigger functions per Supabase security advisor
-- (function_search_path_mutable) to prevent search_path hijacking.

alter function public.set_updated_at() set search_path = '';
alter function public.validate_extraction_region_source() set search_path = 'public';
