create extension if not exists "uuid-ossp";

create table if not exists users
(
    user_id      uuid default uuid_generate_v4(),
    username     varchar(255) not null,
    password     varchar(255) not null,
    display_name varchar(255) not null,
    constraint users_pk primary key (user_id),
    constraint users_username_uq unique (username)
);


create table if not exists registered_days
(
    registered_day_id uuid default uuid_generate_v4(),
    user_id           uuid not null,
    date              date not null,
    level             int  not null,
    comment           text,
    constraint registered_days_pk primary key (registered_day_id),
    constraint registered_days_user_id_fk foreign key (user_id) references users (user_id),
    constraint registered_days_date_user_id_uq unique (date, user_id)
);