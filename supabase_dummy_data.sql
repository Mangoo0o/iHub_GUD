-- Dummy Data for CSF iHub
-- This inserts 10 high-quality dummy responses based on the relational schema:
-- registrations (Part I) linked to evaluations (Part II, III, IV)

do $$
declare
    reg_id uuid;
    i int;
    parent_names text[] := array['Juan Dela Cruz', 'Maria Santos', 'Oliver Twist', 'Elena Gilbert', 'Damon Salvatore', 'Stefan Salvatore', 'Bonnie Bennett', 'Caroline Forbes', 'Jeremy Gilbert', 'Alaric Saltzman'];
    sexes text[] := array['Male', 'Female', 'Male', 'Female', 'Male', 'Male', 'Female', 'Female', 'Male', 'Male'];
    offices text[] := array['Regional Office I', 'Field Office 02', 'Satellite Unit A', 'Main Hub - North', 'Regional Office II', 'Field Office 03', 'Main Hub - South', 'Satellite Unit B', 'Field Office 01', 'Regional Office III'];
    country_codes text[] := array['+63', '+63', '+1', '+63', '+63', '+63', '+44', '+63', '+63', '+63'];
    satisfaction_options text[] := array['Very Satisfied', 'Satisfied', 'Neutral', 'Satisfied', 'Very Satisfied'];
    rating_options text[] := array['excellent', 'veryGood', 'good', 'excellent', 'veryGood'];
    comments text[] := array[
        'Great facility! The staff were very helpful.',
        'My child enjoyed the toys. Clean environment.',
        'Accessible location and friendly guards.',
        'Could use more educational materials, but overall good.',
        'Very attentive staff. Highly recommended!',
        'Safety measures are impressive. Thank you.',
        'Convenient for parents. Keep it up!',
        'Maintenance is top-notch. Very satisfied.',
        'Friendly staff and clean station.',
        'Excellent service and support for children.'
    ];
begin
    -- 1) Clear existing evaluation data (optional, but good for testing)
    -- truncate table public.evaluations cascade;
    -- truncate table public.registrations cascade;

    for i in 1..10 loop
        -- Insert into registrations
        insert into public.registrations (
            code, 
            parent_name, 
            sex, 
            country_code, 
            contact_number, 
            office_unit_address, 
            office_unit_other, 
            date_of_use, 
            children,
            created_at
        ) values (
            'ABC' || floor(random() * 900 + 100)::text, -- Random 3-digit code
            parent_names[i],
            sexes[i],
            country_codes[i],
            floor(random() * 9000000 + 1000000)::text,
            offices[i],
            case when i % 5 = 0 then 'Special Operations Unit' else null end,
            current_date - (i || ' days')::interval,
            -- Realistic multi-child scenarios for some
            case 
                when i % 3 = 0 then 
                    '[{"name": "Kid A", "age": 4, "sex": "Male"}, {"name": "Kid B", "age": 2, "sex": "Female"}]'::jsonb
                else 
                    ('[{"name": "Child ' || i || '", "age": ' || (2 + (i % 6)) || ', "sex": "' || (case when i % 2 = 0 then 'Male' else 'Female' end) || '"}]')::jsonb
            end,
            now() - (i || ' days')::interval
        ) returning id into reg_id;

        -- Insert into evaluations
        insert into public.evaluations (
            registration_id, 
            answers, 
            comments,
            created_at
        ) values (
            reg_id,
            jsonb_build_object(
                'cleanliness_safety', rating_options[1 + floor(random() * 5)],
                'child_comfort', rating_options[1 + floor(random() * 5)],
                'toys_materials', rating_options[1 + floor(random() * 5)],
                'staff_attentiveness', rating_options[1 + floor(random() * 5)],
                'accessibility_convenience', rating_options[1 + floor(random() * 5)],
                'maintenance_upkeep', rating_options[1 + floor(random() * 5)],
                'staff_responsiveness', rating_options[1 + floor(random() * 5)],
                'staff_eval_attentiveness', rating_options[1 + floor(random() * 5)],
                'staff_eval_friendliness', rating_options[1 + floor(random() * 5)],
                'staff_eval_responsiveness', rating_options[1 + floor(random() * 5)],
                'overall_satisfaction', satisfaction_options[1 + floor(random() * 5)]
            ),
            comments[i],
            now() - (i || ' days')::interval
        );
    end loop;
end $$;
