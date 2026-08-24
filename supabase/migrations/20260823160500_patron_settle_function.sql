alter table public.patron_orders add column if not exists note text;

create or replace function public.settle_patron_order(p_order_id text, p_payment_id text)
returns text
language plpgsql
as $$
declare
  v_order public.patron_orders%rowtype;
  v_current_price integer;
begin
  select * into v_order from public.patron_orders where order_id = p_order_id for update;

  if not found then
    return 'not_found';
  end if;

  if v_order.status <> 'pending' then
    return v_order.status;
  end if;

  select price into v_current_price from public.patrons where car_slug = v_order.car_slug;

  if v_current_price is not null and v_current_price >= v_order.price then
    update public.patron_orders
      set status = 'failed',
          note = 'Ödeme başarılı ama sunucu doğrulamasında fiyat artık en yüksek değildi — manuel iade gerekir. payment_id=' || coalesce(p_payment_id, '')
      where order_id = p_order_id;
    return 'outbid';
  end if;

  if v_current_price is not null then
    insert into public.patron_history (car_slug, name, platform, handle, price)
    select car_slug, name, platform, handle, price from public.patrons where car_slug = v_order.car_slug;
  end if;

  insert into public.patrons (car_slug, name, tagline, platform, handle, url, price, updated_at)
  values (v_order.car_slug, v_order.name, v_order.tagline, v_order.platform, v_order.handle, v_order.url, v_order.price, now())
  on conflict (car_slug) do update set
    name = excluded.name,
    tagline = excluded.tagline,
    platform = excluded.platform,
    handle = excluded.handle,
    url = excluded.url,
    price = excluded.price,
    updated_at = excluded.updated_at;

  update public.patron_orders
    set status = 'paid', paid_at = now()
    where order_id = p_order_id;

  return 'paid';
end;
$$;

revoke execute on function public.settle_patron_order(text, text) from public;
grant execute on function public.settle_patron_order(text, text) to service_role;
