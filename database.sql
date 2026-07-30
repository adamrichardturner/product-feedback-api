CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE public.users (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    email varchar(255) NOT NULL,
    password_hash varchar(255) NOT NULL,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email)
);

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    username varchar(255) NOT NULL,
    full_name varchar(255) NOT NULL,
    avatar_url text NULL,
    website varchar(255) NULL,
    updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_username_key UNIQUE (username),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE TABLE public.feedback (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    title varchar(255) NOT NULL,
    detail text NOT NULL,
    category varchar(50) NOT NULL,
    status varchar(50) DEFAULT 'suggestion'::character varying NOT NULL,
    "order" integer NULL,
    upvotes integer DEFAULT 0 NOT NULL,
    inserted_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT feedback_pkey PRIMARY KEY (id),
    CONSTRAINT feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT feedback_category_check CHECK (category IN ('ui', 'ux', 'enhancement', 'bug', 'feature')),
    CONSTRAINT feedback_status_check CHECK (status IN ('suggestion', 'planned', 'progress', 'live'))
);

CREATE TABLE public.votes (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    feedback_id uuid NOT NULL,
    created_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT votes_pkey PRIMARY KEY (id),
    CONSTRAINT votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT votes_feedback_id_fkey FOREIGN KEY (feedback_id) REFERENCES public.feedback(id) ON DELETE CASCADE,
    CONSTRAINT votes_user_feedback_unique UNIQUE (user_id, feedback_id)
);

CREATE TABLE public.comments (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    feedback_id uuid NOT NULL,
    user_id uuid NOT NULL,
    parent_comment_id uuid NULL,
    content text NOT NULL,
    inserted_at timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT comments_pkey PRIMARY KEY (id),
    CONSTRAINT comments_feedback_id_fkey FOREIGN KEY (feedback_id) REFERENCES public.feedback(id) ON DELETE CASCADE,
    CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
    CONSTRAINT comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.comments(id) ON DELETE CASCADE
);

CREATE INDEX idx_feedback_status ON public.feedback USING btree (status);
CREATE INDEX idx_feedback_category ON public.feedback USING btree (category);
CREATE INDEX idx_feedback_user_id ON public.feedback USING btree (user_id);
CREATE INDEX idx_votes_feedback_id ON public.votes USING btree (feedback_id);
CREATE INDEX idx_votes_user_id ON public.votes USING btree (user_id);
CREATE INDEX idx_comments_feedback_id ON public.comments USING btree (feedback_id);
CREATE INDEX idx_comments_parent_comment_id ON public.comments USING btree (parent_comment_id);

CREATE OR REPLACE FUNCTION update_feedback_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_feedback_timestamp
BEFORE UPDATE ON public.feedback
FOR EACH ROW
EXECUTE PROCEDURE update_feedback_timestamp();
