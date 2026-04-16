--
-- PostgreSQL database dump
--

\restrict yHBqMDg5jt9wRX73d6JAaejNz3FU2VBk0VaaIauK7NurxbLSTwEIDfFUwBSBeFx

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: update_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
      $$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: contact_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contact_messages (
    id integer NOT NULL,
    name character varying(100),
    email character varying(150),
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: contact_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contact_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contact_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contact_messages_id_seq OWNED BY public.contact_messages.id;


--
-- Name: event_registrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.event_registrations (
    id integer NOT NULL,
    event_id integer,
    user_id integer,
    first_name character varying(100),
    last_name character varying(100),
    email character varying(150),
    payment_method character varying(50),
    paid boolean DEFAULT false,
    registered_at timestamp with time zone DEFAULT now()
);


--
-- Name: event_registrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.event_registrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: event_registrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.event_registrations_id_seq OWNED BY public.event_registrations.id;


--
-- Name: events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.events (
    id integer NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    date timestamp with time zone NOT NULL,
    location character varying(200),
    type character varying(50),
    price numeric(10,2) DEFAULT 0,
    image_url character varying(500),
    is_past boolean DEFAULT false,
    created_by integer,
    created_at timestamp with time zone DEFAULT now(),
    max_participants integer,
    category character varying(50) DEFAULT NULL::character varying
);


--
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.events_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: events_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.events_id_seq OWNED BY public.events.id;


--
-- Name: gallery; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.gallery (
    id integer NOT NULL,
    title character varying(200),
    src character varying(500) NOT NULL,
    category character varying(50),
    is_private boolean DEFAULT false,
    uploaded_by integer,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: gallery_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.gallery_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: gallery_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.gallery_id_seq OWNED BY public.gallery.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    user_id integer,
    token character varying(500) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    profession character varying(100),
    city character varying(100),
    bio text,
    avatar_url character varying(500),
    plan character varying(20) DEFAULT 'annual'::character varying,
    is_active boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    bureau_role character varying(100) DEFAULT NULL::character varying,
    hometown character varying(100) DEFAULT NULL::character varying,
    phone character varying(30) DEFAULT NULL::character varying,
    facebook character varying(300) DEFAULT NULL::character varying,
    linkedin character varying(300) DEFAULT NULL::character varying
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: contact_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages ALTER COLUMN id SET DEFAULT nextval('public.contact_messages_id_seq'::regclass);


--
-- Name: event_registrations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations ALTER COLUMN id SET DEFAULT nextval('public.event_registrations_id_seq'::regclass);


--
-- Name: events id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events ALTER COLUMN id SET DEFAULT nextval('public.events_id_seq'::regclass);


--
-- Name: gallery id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery ALTER COLUMN id SET DEFAULT nextval('public.gallery_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: contact_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contact_messages (id, name, email, message, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: event_registrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.event_registrations (id, event_id, user_id, first_name, last_name, email, payment_method, paid, registered_at) FROM stdin;
1	5	1	VORO	DC	charlotvoro@gmail.com	\N	t	2026-04-15 00:00:49.980349+03
2	4	1	VORO	DC	charlotvoro@gmail.com	\N	t	2026-04-16 05:24:41.110453+03
3	6	1	Bricossa	Bro	bri@gmail.com	\N	t	2026-04-16 11:40:43.58789+03
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.events (id, title, description, date, location, type, price, image_url, is_past, created_by, created_at, max_participants, category) FROM stdin;
2	Atelier Pro : La Tech en 2026	Une plongée dans les tendances de l'industrie.	2026-02-15 16:00:00+03	Hometown Hub	Formation	0.00	https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800	f	\N	2026-04-13 18:17:15.405687+03	\N	\N
4	Aniversaire DC	come over	2026-07-17 16:28:00+03	DC Home	Gala	0.00	/uploads/event-Gemini_Generated_Image_nqm7bon-1776198508751.png	f	1	2026-04-14 23:28:28.775459+03	40	\N
5	Atelier Electro	High vision	2026-05-02 04:58:00+03	Librarie	Formation	1000.00	/uploads/event-tÃ©lÃ©chargement-(76)-1776200322066.jpg	f	1	2026-04-14 23:58:42.073281+03	22	Formation
6	FOOT	FOOTBALL	2026-04-17 14:38:00+03	Betongolo	Sportif	0.00	/uploads/event-PXL_20230819_151204141.NIGHT-1776328708597.jpg	f	1	2026-04-16 11:38:28.639503+03	\N	Sportif
\.


--
-- Data for Name: gallery; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.gallery (id, title, src, category, is_private, uploaded_by, created_at) FROM stdin;
2	Leadership Training	https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800	Workshops	t	\N	2026-04-13 18:17:15.405687+03
7	pdpd	/uploads/gallery-1776182503928-2f9uy2zob1f.png	\N	f	1	2026-04-14 19:01:43.980993+03
8	IMG_20210424_171922	/uploads/gallery-1776189033847-g16l3i9eh1d.jpg	\N	f	1	2026-04-14 20:50:33.914655+03
9	9ac41512-8097-40b3-aff0-3a3bb6c5825f	/uploads/gallery-1776189091776-xe6kq6eqla.jpg	\N	f	1	2026-04-14 20:51:31.780728+03
10	18	/uploads/gallery-1776189091817-awzi7c95siu.jpg	\N	f	1	2026-04-14 20:51:31.841523+03
11	29367e24-2851-4255-a789-85e05e6dff8b	/uploads/gallery-1776189091908-ok1s1uo8hv.jpg	\N	f	1	2026-04-14 20:51:31.916363+03
12	AG	/uploads/gallery-1776189091996-8ghzo4nis8r.jpg	\N	f	1	2026-04-14 20:51:32.002251+03
13	event	/uploads/gallery-1776189092671-m99asp97cp.jpg	\N	f	1	2026-04-14 20:51:32.680775+03
15	img	/uploads/gallery-1776189092803-z942msu4fsr.jpg	\N	f	1	2026-04-14 20:51:32.81168+03
16	lalane	/uploads/gallery-1776189092908-jre5euee02h.jpg	\N	f	1	2026-04-14 20:51:32.916791+03
17	live	/uploads/gallery-1776189093018-ds0vo6egr2l.jpg	\N	f	1	2026-04-14 20:51:33.069199+03
18	logo copy	/uploads/gallery-1776189093161-uidp6bwaww.png	\N	f	1	2026-04-14 20:51:33.220602+03
19	logo	/uploads/gallery-1776189093323-rd2x7u54kw.png	\N	f	1	2026-04-14 20:51:33.333547+03
20	logo1 copy	/uploads/gallery-1776189093571-hpxtrtoq26q.png	\N	f	1	2026-04-14 20:51:33.605921+03
21	logo1	/uploads/gallery-1776189094839-0xrjatktzr1.png	\N	f	1	2026-04-14 20:51:34.849426+03
22	logo2	/uploads/gallery-1776189094941-8loj4h9srkw.png	\N	f	1	2026-04-14 20:51:34.988127+03
23	Mac	/uploads/gallery-1776189095182-3tb2j56e047.jpg	\N	f	1	2026-04-14 20:51:35.186545+03
24	new	/uploads/gallery-1776189095209-7etqub7nx1j.jpg	\N	f	1	2026-04-14 20:51:35.24697+03
25	ok	/uploads/gallery-1776189095323-5wc96sxgqgb.jpg	\N	f	1	2026-04-14 20:51:35.328486+03
26	party1	/uploads/gallery-1776189095449-kfzsqeh2wg.jpg	\N	f	1	2026-04-14 20:51:35.475538+03
27	party2	/uploads/gallery-1776189095616-2kvmhvhpqgi.jpg	\N	f	1	2026-04-14 20:51:35.671182+03
28	party3	/uploads/gallery-1776189097642-qahcjlu4of.jpg	\N	f	1	2026-04-14 20:51:37.67723+03
29	party4	/uploads/gallery-1776189097825-nbhw4ksxno.jpg	\N	f	1	2026-04-14 20:51:37.837398+03
30	party5	/uploads/gallery-1776189101771-9nnlndua1sc.jpg	\N	f	1	2026-04-14 20:51:41.809283+03
31	party6	/uploads/gallery-1776189102047-zs6c6rdqib9.jpg	\N	f	1	2026-04-14 20:51:42.054461+03
32	party7	/uploads/gallery-1776189104560-eo7wh7f37tq.jpg	\N	f	1	2026-04-14 20:51:44.594419+03
33	president	/uploads/gallery-1776189104774-s87qi5a0syq.jpg	\N	f	1	2026-04-14 20:51:44.779436+03
34	ravana	/uploads/gallery-1776189105063-3wat0z5hx1f.jpg	\N	f	1	2026-04-14 20:51:45.113231+03
37	sg	/uploads/gallery-1776189105798-t34690sl3s.jpg	\N	f	1	2026-04-14 20:51:45.806268+03
38	tsodrano	/uploads/gallery-1776189105991-hdr2qe9w0j.jpg	\N	f	1	2026-04-14 20:51:45.996921+03
40	VO	/uploads/gallery-1776189106357-1vro09yfuqs.jpg	\N	f	1	2026-04-14 20:51:46.376256+03
41	vp	/uploads/gallery-1776189106438-uin855i5m6b.jpg	\N	f	1	2026-04-14 20:51:46.463349+03
42	we2	/uploads/gallery-1776189106531-f6r259udm8l.jpg	\N	f	1	2026-04-14 20:51:46.536434+03
43	dark	/uploads/gallery-Mysterious-Faceless-Man-in-Bla-1776198316956.jpg	Ateliers	t	1	2026-04-14 23:25:16.968855+03
44	00	/uploads/gallery-1773934629985-(1)-1776201073535.jpg	Social	f	1	2026-04-15 00:11:13.539434+03
45	\N	/uploads/gallery-ChatGPT-Image-31-mars-2026,-09-1776201111826.png	Culturel	f	1	2026-04-15 00:11:51.878016+03
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.refresh_tokens (id, user_id, token, expires_at, created_at) FROM stdin;
23	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc2MTg1ODUwLCJleHAiOjE3Nzg3Nzc4NTB9.Cg2rUqh66SNlV8ZscZKaDB88Y00jCrDIIrq_hSlpBTk	2026-05-14 19:57:30.661+03	2026-04-14 19:57:30.662567+03
25	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc2MjM2MDAwLCJleHAiOjE3Nzg4MjgwMDB9.fpFQ83OzRG-k1IyGB7jziUuUOXj93wcWIgJaV1mAwVk	2026-05-15 09:53:20.353+03	2026-04-15 09:53:20.354507+03
26	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc2MjQ0Mjc5LCJleHAiOjE3Nzg4MzYyNzl9.qHOPAubgSRx7wbTXWXzRMblAbesvg1gq48VSvhKZMYs	2026-05-15 12:11:19.906+03	2026-04-15 12:11:19.90799+03
27	3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc2MjQ0MzUyLCJleHAiOjE3Nzg4MzYzNTJ9.i40QWuQn49bUMVgup6LdpraZg-AfO0nzusEz7ovhfNo	2026-05-15 12:12:32.602+03	2026-04-15 12:12:32.602514+03
29	3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc2MjQ0NDY2LCJleHAiOjE3Nzg4MzY0NjZ9.DEhz3u7JRtOahown4tDUYVTld8z2AC8NJchRsfDql0s	2026-05-15 12:14:26.732+03	2026-04-15 12:14:26.73303+03
36	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc2MzI4NjMwLCJleHAiOjE3Nzg5MjA2MzB9.Nxl0db0DxnZnlRddKmPSgOLUcBiQEDeuxtJZSTOIxqw	2026-05-16 11:37:10.193+03	2026-04-16 11:37:10.194351+03
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session (sid, sess, expire) FROM stdin;
LOWaLEtbwoHD7M_npVB428ojNujVIc1i	{"cookie":{"originalMaxAge":604800000,"expires":"2026-04-23T08:37:10.198Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":1,"role":"admin"}	2026-04-23 16:56:46
fOiBnH7bXGr_R3VOe4erQ1ovrM1bRJE_	{"cookie":{"originalMaxAge":604800000,"expires":"2026-04-21T16:57:30.664Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"userId":1,"role":"admin"}	2026-04-22 08:54:02
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, password_hash, role, profession, city, bio, avatar_url, plan, is_active, created_at, updated_at, bureau_role, hometown, phone, facebook, linkedin) FROM stdin;
1	Admin Tragnorek	admin@asso.mg	$2a$12$dT9UreVf94jaLKhfa4lncu7CyZrMGy2L9VgrPa/Fq6ulKRPgKh2Pe	admin	Developpeur	Antananarivo	HAHA	/uploads/avatar-1-1776149327154.jpg	annual	t	2026-04-13 18:17:15.405687+03	2026-04-16 10:47:10.683212+03	\N	Vatomandry		https://www.facebook.com/voro.wilfried.dc/	
10	Angelico Denisé VORO	angelico@gmail.com	$2a$12$JyNTCZMz7zLxG8zRMdOoe.ChOc1AFXvILrl8EaSQJcft0AuHBQ.2e	bureau	BusinessMan	Antananarivo	be the man 	/uploads/avatar-.trashed-1724599389-PXL_202407-1776326156287.jpg	annual	t	2026-04-16 10:53:01.156021+03	2026-04-16 10:58:05.110198+03	Membre du Bureau	Vatomandry	0347866799	https://www.facebook.com/voro.wilfried.dc/	
7	All  Abdallas	abdallas@gmail.com	$2a$12$ekILPLWFCKRYFEN/io2jlukBXeqqO1.daTqWyAiwJ8EfDmPpQtlyq	member	OPOP	Ampao	\N	\N	annual	t	2026-04-13 19:34:38.699724+03	2026-04-14 00:40:53.967064+03	\N	\N	\N	\N	\N
8	VORO DC	charlvoro@gmail.com	$2a$12$j2f6HYU/eN/tGYaZCNBHCueRtiPxEA65xgHOsGR9kSwV4y12pIeuC	bureau	IT Student	Ambato	\N	\N	annual	t	2026-04-14 00:08:27.038588+03	2026-04-14 08:15:00.348464+03	Secrétaire Général	\N	\N	\N	\N
2	Wilfried DC	wilfried@mail.mg	$2a$12$TYxVr.3MHd6xDZplHkjL2OmW/bnM9zjgy6srIRwFgVjSm3fsQOaXm	bureau	Developpeur	Antananarivo	I'm American and that's a fact	/uploads/avatar-2-1776162032013.png	annual	t	2026-04-13 18:17:15.405687+03	2026-04-15 08:40:12.55099+03	Président	Vatomandry	0347866799	https://www.facebook.com/voro.wilfried.dc/	https://www.linkedin.com/in/voro-wilfried-dc/
3	Deli	charlotvoro@gmail.com	$2a$12$n3vZrhC6hWijoX2YllQl5eLLDvVpvnjzMXLuzMmQejD9Xrj8G6Pvy	bureau		Antananarivo		/uploads/avatar-Gemini_Generated_Image_74ir5f7-1776244570562.png	annual	t	2026-04-13 19:15:33.02467+03	2026-04-15 16:28:56.232795+03	Responsable Communication				
9	Andriantsiory Sarobidy	sarobidy@gmail.com	$2a$12$YkMasy3v51I5B5fLUq/E1eVk8lCVJ6fIBzrCpMCH.AyfeJN4Dkx1S	member	Etudiant	Vatomandry	\N	\N	annual	t	2026-04-16 05:41:31.000049+03	2026-04-16 05:42:11.915659+03	\N	\N	\N	\N	\N
\.


--
-- Name: contact_messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contact_messages_id_seq', 1, false);


--
-- Name: event_registrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.event_registrations_id_seq', 3, true);


--
-- Name: events_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.events_id_seq', 6, true);


--
-- Name: gallery_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.gallery_id_seq', 45, true);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 36, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 10, true);


--
-- Name: contact_messages contact_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contact_messages
    ADD CONSTRAINT contact_messages_pkey PRIMARY KEY (id);


--
-- Name: event_registrations event_registrations_event_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_event_id_user_id_key UNIQUE (event_id, user_id);


--
-- Name: event_registrations event_registrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: gallery gallery_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery
    ADD CONSTRAINT gallery_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_key UNIQUE (token);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: users set_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


--
-- Name: event_registrations event_registrations_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_registrations event_registrations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.event_registrations
    ADD CONSTRAINT event_registrations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: events events_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: gallery gallery_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.gallery
    ADD CONSTRAINT gallery_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict yHBqMDg5jt9wRX73d6JAaejNz3FU2VBk0VaaIauK7NurxbLSTwEIDfFUwBSBeFx

