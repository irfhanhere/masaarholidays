-- Tier-level package card copy. Both fields are synced across duration
-- variants by the package admin action and rendered wherever package cards appear.
alter table public.packages
  add column if not exists tagline text;

comment on column public.packages.tagline is
  'Short tier-level positioning line shown on package cards. Synced across duration-variant siblings.';

update public.packages
set
  short_description = case tier
    when 'essential' then 'Smart & Budget-Friendly — Comfortable accommodation with reliable private shuttle service — an ideal choice for travellers seeking value without compromising on convenience.'
    when 'signature' then 'Close to the Haram — Carefully selected hotels just steps away from the Haram, offering easy access and added convenience throughout your Umrah journey.'
    when 'exclusive' then 'Premium Haram Proximity — Premium accommodation within the Haram Plaza, offering exceptional convenience with approximately a 1-3-minute walk to the Haram.'
  end,
  tagline = case tier
    when 'essential' then 'Smart & Comfortable — Ideal for younger travellers looking for a budget-friendly Umrah option.'
    when 'signature' then 'Comfort & Convenience — Suitable for all age groups, offering a comfortable and convenient Umrah experience.'
    when 'exclusive' then 'Premium & Private — Ideal for all age groups, especially parents, elderly travellers, and pilgrims who may require additional assistance.'
  end
where type = 'umrah'::public.package_type;