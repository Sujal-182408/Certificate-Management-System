--
-- PostgreSQL database dump
--

\restrict hq3LRfE14daR5sSEEJVdAnCwBfYah68qlj7qxHalQ4uHcPjbfAaNPUt8YpNDQV9

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_users (
    id bigint NOT NULL,
    email character varying(254) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'admin'::character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_login_at timestamp with time zone,
    CONSTRAINT admin_users_role_check CHECK (((role)::text = 'admin'::text))
);


--
-- Name: admin_users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.admin_users ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.admin_users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: certificate_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificate_audit_logs (
    id bigint NOT NULL,
    certificate_id bigint,
    action character varying(50) NOT NULL,
    performed_by character varying(150) NOT NULL,
    details jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: certificate_audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.certificate_audit_logs ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.certificate_audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: certificate_number_sequences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificate_number_sequences (
    certificate_type character varying(10) NOT NULL,
    certificate_year integer NOT NULL,
    next_number integer DEFAULT 1001 NOT NULL,
    CONSTRAINT certificate_sequence_number_check CHECK ((next_number >= 1001)),
    CONSTRAINT certificate_sequence_type_check CHECK (((certificate_type)::text = ANY ((ARRAY['CERT'::character varying, 'INTR'::character varying])::text[]))),
    CONSTRAINT certificate_sequence_year_check CHECK ((certificate_year >= 2000))
);


--
-- Name: certificates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.certificates (
    id bigint NOT NULL,
    certificate_no character varying(100) NOT NULL,
    recipient_name character varying(150) NOT NULL,
    course_name character varying(200) NOT NULL,
    issuer_name character varying(200) NOT NULL,
    issue_date date DEFAULT CURRENT_DATE NOT NULL,
    verification_token uuid DEFAULT gen_random_uuid() NOT NULL,
    status character varying(20) DEFAULT 'issued'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    revoked_at timestamp with time zone,
    employee_id bigint,
    qr_generated_at timestamp with time zone,
    certificate_type character varying(10) NOT NULL,
    CONSTRAINT certificates_certificate_type_check CHECK (((certificate_type)::text = ANY ((ARRAY['CERT'::character varying, 'INTR'::character varying])::text[]))),
    CONSTRAINT certificates_check CHECK (((((status)::text = 'issued'::text) AND (revoked_at IS NULL)) OR (((status)::text = 'revoked'::text) AND (revoked_at IS NOT NULL)))),
    CONSTRAINT certificates_status_check CHECK (((status)::text = ANY ((ARRAY['issued'::character varying, 'revoked'::character varying])::text[])))
);


--
-- Name: certificates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.certificates ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.certificates_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: employee_users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.employee_users (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(254) NOT NULL,
    password_hash text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_login_at timestamp with time zone
);


--
-- Name: employee_users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.employee_users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: employee_users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.employee_users_id_seq OWNED BY public.employee_users.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(150),
    age integer
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.users ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: employee_users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_users ALTER COLUMN id SET DEFAULT nextval('public.employee_users_id_seq'::regclass);


--
-- Data for Name: admin_users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_users (id, email, password_hash, role, is_active, created_at, last_login_at) FROM stdin;
1	nsujalkant@gmail.com	$2b$12$zbyiPU3DjR5kKTE7aC0B6.dvXirg/J3VZmpY2FCXAEILPv7qlOxTu	admin	t	2026-10-01 21:33:35.689797+05:30	2026-10-06 04:34:11.272474+05:30
\.


--
-- Data for Name: certificate_audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.certificate_audit_logs (id, certificate_id, action, performed_by, details, created_at) FROM stdin;
13	7	CERTIFICATE_CREATED	nsujalkant@gmail.com	{"employee_id": "5", "certificate_no": "EITS-INTR-2026-1001", "employee_email": "sujal.kant@esparksit.com", "certificate_type": "INTR", "certificate_year": 2026}	2026-10-06 03:55:42.787897+05:30
\.


--
-- Data for Name: certificate_number_sequences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.certificate_number_sequences (certificate_type, certificate_year, next_number) FROM stdin;
INTR	2026	1002
\.


--
-- Data for Name: certificates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.certificates (id, certificate_no, recipient_name, course_name, issuer_name, issue_date, verification_token, status, created_at, revoked_at, employee_id, qr_generated_at, certificate_type) FROM stdin;
7	EITS-INTR-2026-1001	Sujal Kant Nirala	Full Stack Development	eSparks IT Solutions	2026-10-05	e90ebec1-8352-464a-a038-d6351df63058	issued	2026-10-06 03:55:42.787897+05:30	\N	5	2026-10-06 04:36:21.443566+05:30	INTR
\.


--
-- Data for Name: employee_users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.employee_users (id, name, email, password_hash, is_active, created_at, last_login_at) FROM stdin;
5	Sujal Kant Nirala	sujal.kant@esparksit.com	$2b$12$493ONBmotYKKloubiDn.GOkuCJ5BhscknE97shmyljRbKrkIxINB2	t	2026-10-06 03:40:13.28277+05:30	2026-10-06 04:36:19.555107+05:30
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, age) FROM stdin;
1	Joy	joy@example.com	22
2	Sujal	sujal@example.com	21
\.


--
-- Name: admin_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.admin_users_id_seq', 1, true);


--
-- Name: certificate_audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.certificate_audit_logs_id_seq', 13, true);


--
-- Name: certificates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.certificates_id_seq', 7, true);


--
-- Name: employee_users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.employee_users_id_seq', 5, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 2, true);


--
-- Name: admin_users admin_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_users
    ADD CONSTRAINT admin_users_pkey PRIMARY KEY (id);


--
-- Name: certificate_audit_logs certificate_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_audit_logs
    ADD CONSTRAINT certificate_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: certificate_number_sequences certificate_number_sequences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_number_sequences
    ADD CONSTRAINT certificate_number_sequences_pkey PRIMARY KEY (certificate_type, certificate_year);


--
-- Name: certificates certificates_certificate_no_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_certificate_no_key UNIQUE (certificate_no);


--
-- Name: certificates certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_pkey PRIMARY KEY (id);


--
-- Name: certificates certificates_verification_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_verification_token_key UNIQUE (verification_token);


--
-- Name: employee_users employee_users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_users
    ADD CONSTRAINT employee_users_email_key UNIQUE (email);


--
-- Name: employee_users employee_users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.employee_users
    ADD CONSTRAINT employee_users_pkey PRIMARY KEY (id);


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
-- Name: admin_users_email_lower_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX admin_users_email_lower_unique ON public.admin_users USING btree (lower((email)::text));


--
-- Name: employee_users_email_lower_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX employee_users_email_lower_unique ON public.employee_users USING btree (lower((email)::text));


--
-- Name: idx_certificates_employee_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_certificates_employee_id ON public.certificates USING btree (employee_id);


--
-- Name: certificate_audit_logs certificate_audit_logs_certificate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificate_audit_logs
    ADD CONSTRAINT certificate_audit_logs_certificate_id_fkey FOREIGN KEY (certificate_id) REFERENCES public.certificates(id);


--
-- Name: certificates certificates_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.certificates
    ADD CONSTRAINT certificates_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.employee_users(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict hq3LRfE14daR5sSEEJVdAnCwBfYah68qlj7qxHalQ4uHcPjbfAaNPUt8YpNDQV9

