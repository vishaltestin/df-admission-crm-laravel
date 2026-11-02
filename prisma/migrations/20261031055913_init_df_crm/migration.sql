-- CreateTable
CREATE TABLE `activations` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `completed_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_form_responses` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `lead_form_id` BIGINT UNSIGNED NOT NULL,
    `response_json` LONGTEXT NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `fill_percentage` INTEGER NOT NULL DEFAULT 0,
    `email_verified` INTEGER NOT NULL DEFAULT 0,
    `otp_verified` INTEGER NOT NULL DEFAULT 0,
    `lead_id` INTEGER NOT NULL DEFAULT 0,
    `payment_amount` INTEGER NOT NULL DEFAULT 0,
    `payment_method` VARCHAR(255) NULL,
    `payment_status` INTEGER NOT NULL DEFAULT 0,
    `organization_id` INTEGER NOT NULL DEFAULT 0,
    `assigned_to` INTEGER NOT NULL DEFAULT 0,
    `payment_need_to_take` INTEGER NOT NULL DEFAULT 0,
    `session_id` VARCHAR(255) NULL,
    `current_step` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(255) NULL,

    INDEX `fk_responses_form`(`lead_form_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `application_forms` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `unique_code` VARCHAR(50) NULL,
    `title` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `status` ENUM('1', '0') NULL DEFAULT '1',
    `created_by` BIGINT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `allowed_countries` LONGTEXT NULL,
    `allowed_institutes` LONGTEXT NULL,
    `fees` DECIMAL(10, 2) NULL,
    `tax` DECIMAL(5, 2) NULL,
    `total_amount` DECIMAL(10, 2) NULL,
    `gateway` VARCHAR(50) NULL,
    `form_name` VARCHAR(255) NULL,
    `organization_id` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attributes` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `type` VARCHAR(255) NOT NULL,
    `lookup_type` VARCHAR(255) NULL,
    `entity_type` VARCHAR(255) NOT NULL,
    `sort_order` INTEGER NULL,
    `validation` VARCHAR(255) NULL,
    `is_required` BOOLEAN NOT NULL DEFAULT false,
    `is_unique` BOOLEAN NOT NULL DEFAULT false,
    `quick_add` BOOLEAN NOT NULL DEFAULT false,
    `is_user_defined` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `organization_id` INTEGER NOT NULL DEFAULT 0,
    `form_id` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `automation_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `lead_id` BIGINT UNSIGNED NULL,
    `channel` VARCHAR(20) NOT NULL,
    `mobile` VARCHAR(20) NULL,
    `message` TEXT NULL,
    `provider` VARCHAR(50) NULL,
    `provider_message_id` VARCHAR(100) NULL,
    `status` VARCHAR(20) NULL,
    `response_json` TEXT NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `automation_raw_lead_uploads` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `file_name` VARCHAR(255) NULL,
    `file_path` VARCHAR(500) NULL,
    `total_rows` INTEGER NOT NULL DEFAULT 0,
    `valid_rows` INTEGER NOT NULL DEFAULT 0,
    `duplicate_rows` INTEGER NOT NULL DEFAULT 0,
    `failed_rows` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(30) NOT NULL DEFAULT 'pending',
    `started_at` DATETIME(0) NULL,
    `completed_at` DATETIME(0) NULL,
    `error_message` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `idx_org`(`organization_id`),
    INDEX `idx_status`(`status`),
    INDEX `idx_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `automation_raw_leads` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `upload_id` BIGINT UNSIGNED NULL,
    `name` VARCHAR(191) NULL,
    `mobile` VARCHAR(20) NOT NULL,
    `course` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `campaign` VARCHAR(191) NULL,
    `source` VARCHAR(191) NULL,
    `status` ENUM('pending', 'whatsapp_sent', 'ivr_sent', 'confirmed', 'rejected', 'ivr_failed') NOT NULL DEFAULT 'pending',
    `ivr_response` VARCHAR(10) NULL,
    `confirm_time` DATETIME(0) NULL,
    `lead_created_status` BOOLEAN NOT NULL DEFAULT false,
    `lead_created_time` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `organization_id` INTEGER NOT NULL DEFAULT 0,

    INDEX `idx_mobile_course`(`mobile`, `course`),
    INDEX `idx_org_upload`(`organization_id`, `upload_id`),
    INDEX `idx_status`(`status`),
    INDEX `idx_upload_id`(`upload_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `automation_rule_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `org_id` BIGINT UNSIGNED NOT NULL,
    `rule_id` BIGINT UNSIGNED NOT NULL,
    `lead_id` BIGINT UNSIGNED NOT NULL,
    `trigger_event` VARCHAR(100) NOT NULL,
    `action_type` VARCHAR(50) NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'success',
    `message` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `idx_org_created`(`org_id`, `created_at`),
    INDEX `idx_rule_lead_event`(`rule_id`, `lead_id`, `trigger_event`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `automation_rules` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NULL,
    `name` VARCHAR(255) NULL,
    `trigger_event` VARCHAR(100) NULL,
    `conditions` LONGTEXT NULL,
    `actions` LONGTEXT NOT NULL,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_by` BIGINT UNSIGNED NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cache` (
    `key` VARCHAR(255) NOT NULL,
    `value` MEDIUMTEXT NOT NULL,
    `expiration` INTEGER NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cache_locks` (
    `key` VARCHAR(255) NOT NULL,
    `owner` VARCHAR(255) NOT NULL,
    `expiration` INTEGER NOT NULL,

    PRIMARY KEY (`key`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `call_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `lead_id` BIGINT UNSIGNED NOT NULL,
    `agent_id` BIGINT UNSIGNED NULL,
    `direction` VARCHAR(50) NULL,
    `duration` INTEGER NULL,
    `recording_url` VARCHAR(500) NULL,
    `summary` TEXT NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `lead_id`(`lead_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaigns` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `status` VARCHAR(255) NULL,
    `type` VARCHAR(255) NOT NULL,
    `mail_to` VARCHAR(255) NOT NULL,
    `spooling` VARCHAR(255) NULL,
    `marketing_template_id` INTEGER UNSIGNED NULL,
    `marketing_event_id` INTEGER UNSIGNED NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `organization_id` INTEGER NOT NULL DEFAULT 0,

    INDEX `marketing_campaigns_marketing_event_id_foreign`(`marketing_event_id`),
    INDEX `marketing_campaigns_marketing_template_id_foreign`(`marketing_template_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `state_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `communication_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NULL,
    `lead_id` BIGINT UNSIGNED NOT NULL,
    `channel` VARCHAR(50) NULL,
    `sent_by` BIGINT UNSIGNED NULL,
    `to` VARCHAR(255) NULL,
    `subject` VARCHAR(255) NULL,
    `content` LONGTEXT NULL,
    `status` ENUM('pending', 'sent', 'failed') NOT NULL DEFAULT 'pending',
    `sent_at` DATETIME(0) NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `lead_id`(`lead_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `countries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `code` INTEGER NULL,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coupon_usages` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `coupon_id` BIGINT UNSIGNED NOT NULL,
    `lead_id` BIGINT UNSIGNED NULL,
    `application_id` BIGINT UNSIGNED NULL,
    `used_by_user_id` BIGINT UNSIGNED NULL,
    `used_at` DATETIME(0) NULL,
    `discount_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `order_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `meta_json` LONGTEXT NULL,
    `created_at` DATETIME(0) NULL,

    INDEX `idx_coupon`(`coupon_id`),
    INDEX `idx_org`(`organization_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coupons` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `code` VARCHAR(50) NOT NULL,
    `name` VARCHAR(100) NULL,
    `type` ENUM('flat', 'percent') NOT NULL DEFAULT 'flat',
    `value` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `min_amount` DECIMAL(10, 2) NULL,
    `max_discount` DECIMAL(10, 2) NULL,
    `usage_type` ENUM('single', 'multiple') NOT NULL DEFAULT 'single',
    `usage_limit` INTEGER NULL,
    `used_count` INTEGER NOT NULL DEFAULT 0,
    `start_at` DATETIME(0) NULL,
    `end_at` DATETIME(0) NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `created_by` BIGINT UNSIGNED NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    INDEX `idx_org`(`organization_id`),
    UNIQUE INDEX `uq_org_coupon_code`(`organization_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `designation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `status` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `organization_id` INTEGER NOT NULL DEFAULT 0,
    `created_by` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `communication_log_id` BIGINT NULL,
    `organization_id` BIGINT NULL,
    `user_id` BIGINT NULL,
    `template_name` VARCHAR(255) NULL,
    `to_email` VARCHAR(255) NULL,
    `subject` VARCHAR(255) NULL,
    `body` LONGTEXT NULL,
    `status` VARCHAR(50) NULL,
    `response_message` TEXT NULL,
    `provider` VARCHAR(200) NULL,
    `sent_by` BIGINT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `sent_at` DATETIME(0) NULL,
    `last_attempt_at` DATETIME(0) NULL,
    `lead_id` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_settings` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NULL,
    `mail_mailer` VARCHAR(50) NULL,
    `mail_host` VARCHAR(100) NULL,
    `mail_port` VARCHAR(20) NULL,
    `mail_username` VARCHAR(100) NULL,
    `mail_password` VARCHAR(255) NULL,
    `mail_encryption` VARCHAR(10) NULL,
    `mail_from_address` VARCHAR(100) NULL,
    `mail_from_name` VARCHAR(100) NULL,
    `status` TINYINT NULL DEFAULT 1,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `mail_validatessl` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_templates` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `created_by` BIGINT UNSIGNED NOT NULL,
    `send_by` VARCHAR(50) NULL,
    `title` VARCHAR(255) NULL,
    `category` VARCHAR(100) NULL,
    `subject` VARCHAR(255) NULL,
    `message` LONGTEXT NOT NULL,
    `variables_json` LONGTEXT NULL,
    `editable` BOOLEAN NOT NULL DEFAULT true,
    `sent_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `failed_jobs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` VARCHAR(255) NOT NULL,
    `connection` TEXT NOT NULL,
    `queue` TEXT NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `exception` LONGTEXT NOT NULL,
    `failed_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `failed_jobs_uuid_unique`(`uuid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `general_settings` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NULL,
    `app_name` VARCHAR(255) NULL,
    `currency` VARCHAR(10) NULL,
    `timezone` VARCHAR(100) NULL,
    `default_payment_gateway` VARCHAR(50) NULL,
    `payment_credentials` LONGTEXT NULL,
    `date_format` VARCHAR(50) NULL,
    `logo` VARCHAR(255) NULL,
    `favicon` VARCHAR(255) NULL,
    `status` TINYINT NULL DEFAULT 1,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `graphics_settings` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NULL,
    `theme_color` VARCHAR(20) NULL,
    `sidebar_color` VARCHAR(20) NULL,
    `navbar_color` VARCHAR(20) NULL,
    `login_background` VARCHAR(255) NULL,
    `status` TINYINT NULL DEFAULT 1,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `alt` VARCHAR(255) NULL,
    `category_id` INTEGER NOT NULL,
    `type` VARCHAR(255) NOT NULL,
    `filename` VARCHAR(255) NOT NULL,
    `orderby` INTEGER NULL,
    `status` INTEGER NOT NULL,
    `created_at` DATETIME(0) NOT NULL,
    `updated_at` DATETIME(0) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `institutes` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `status` TINYINT NULL DEFAULT 1,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ivr_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `lead_id` BIGINT UNSIGNED NULL,
    `mobile` VARCHAR(20) NOT NULL,
    `dtmf` VARCHAR(10) NULL,
    `call_id` VARCHAR(100) NULL,
    `status` VARCHAR(20) NULL,
    `provider` VARCHAR(50) NULL DEFAULT 'demo',
    `response_json` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ivr_settings` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NULL,
    `provider` VARCHAR(50) NULL,
    `base_url` VARCHAR(255) NULL,
    `authcode` VARCHAR(255) NULL,
    `api_key` TEXT NULL,
    `api_secret` TEXT NULL,
    `caller_id` VARCHAR(50) NULL,
    `default_deskphone` VARCHAR(30) NULL,
    `welcome_audio` VARCHAR(255) NULL,
    `status` TINYINT NULL DEFAULT 1,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `uq_ivr_org`(`organization_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `job_batches` (
    `id` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `total_jobs` INTEGER NOT NULL,
    `pending_jobs` INTEGER NOT NULL,
    `failed_jobs` INTEGER NOT NULL,
    `failed_job_ids` LONGTEXT NOT NULL,
    `options` MEDIUMTEXT NULL,
    `cancelled_at` INTEGER NULL,
    `created_at` INTEGER NOT NULL,
    `finished_at` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jobs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `queue` VARCHAR(255) NOT NULL,
    `payload` LONGTEXT NOT NULL,
    `attempts` TINYINT UNSIGNED NOT NULL,
    `reserved_at` INTEGER UNSIGNED NULL,
    `available_at` INTEGER UNSIGNED NOT NULL,
    `created_at` INTEGER UNSIGNED NOT NULL,

    INDEX `jobs_queue_index`(`queue`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `landing_page_sections` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `page_id` BIGINT UNSIGNED NOT NULL,
    `section_key` VARCHAR(100) NOT NULL,
    `content_json` LONGTEXT NOT NULL,
    `sort_order` INTEGER NULL DEFAULT 0,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `page_id`(`page_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `landing_pages` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `campaign_id` BIGINT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(255) NULL,
    `layout_name` VARCHAR(100) NULL DEFAULT 'velzon',
    `status` TINYINT NULL DEFAULT 1,
    `meta` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `slug`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_activity_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `lead_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `action` VARCHAR(100) NULL,
    `description` TEXT NULL,
    `meta_data` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_applications` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `lead_id` BIGINT NULL,
    `application_form` TINYINT NULL DEFAULT 0,
    `application_score` INTEGER NULL,
    `payment_status` ENUM('pending', 'paid', 'failed') NULL,
    `payment_method` VARCHAR(50) NULL,
    `created_at` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_assignment_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `lead_id` BIGINT UNSIGNED NOT NULL,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `lead_source_id` BIGINT UNSIGNED NULL,
    `assigned_to` BIGINT UNSIGNED NOT NULL,
    `previous_assigned_to` BIGINT UNSIGNED NULL,
    `rule_type` VARCHAR(50) NULL,
    `rule_id` BIGINT UNSIGNED NULL,
    `is_reassign` BOOLEAN NULL DEFAULT false,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_column_settings` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `columns_json` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `org_user_unique`(`organization_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_communication_logs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `lead_id` BIGINT NULL,
    `channel` VARCHAR(50) NOT NULL,
    `direction` ENUM('inbound', 'outbound') NULL,
    `purpose` VARCHAR(100) NULL,
    `created_at` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_creation_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `lead_id` BIGINT UNSIGNED NOT NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `source_type` VARCHAR(50) NOT NULL,
    `channel` VARCHAR(50) NULL,
    `upload_id` BIGINT UNSIGNED NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `remarks` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `lead_id`(`lead_id`),
    INDEX `organization_id`(`organization_id`),
    INDEX `source_type`(`source_type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_distribution_rule_items` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `rule_id` BIGINT UNSIGNED NOT NULL,
    `source_id` BIGINT UNSIGNED NULL,
    `assign_type` ENUM('team', 'user', 'designation') NULL,
    `team_id` BIGINT UNSIGNED NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `designation_id` BIGINT UNSIGNED NULL,
    `percentage` INTEGER NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `rule_id`(`rule_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_distribution_rules` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `rule_name` VARCHAR(255) NOT NULL,
    `distribution_type` ENUM('random', 'source') NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_documents` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `lead_id` BIGINT UNSIGNED NOT NULL,
    `doc_type` VARCHAR(50) NULL,
    `doc_name` VARCHAR(150) NULL,
    `file_path` VARCHAR(255) NOT NULL,
    `file_ext` VARCHAR(20) NULL,
    `file_size` BIGINT NULL,
    `uploaded_by` BIGINT UNSIGNED NULL,
    `status` TINYINT NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_events` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `lead_id` BIGINT UNSIGNED NOT NULL,
    `subject` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `start_at` DATETIME(0) NULL,
    `end_at` DATETIME(0) NULL,
    `owner_id` BIGINT UNSIGNED NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `event_type` VARCHAR(255) NULL,

    INDEX `lead_id`(`lead_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_incoming_raw` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `provider` ENUM('facebook', 'instagram', 'google') NOT NULL,
    `external_lead_id` VARCHAR(100) NULL,
    `lead_data` LONGTEXT NOT NULL,
    `is_converted` BOOLEAN NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uniq_ext_lead`(`provider`, `external_lead_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_integration_credentials` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `provider` ENUM('facebook', 'instagram', 'google') NOT NULL,
    `key` VARCHAR(100) NOT NULL,
    `value` TEXT NOT NULL,
    `is_encrypted` BOOLEAN NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `idx_org_provider`(`organization_id`, `provider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_integrations` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `provider` ENUM('facebook', 'instagram', 'google') NOT NULL,
    `is_enabled` BOOLEAN NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uniq_org_provider`(`organization_id`, `provider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_notes` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `lead_id` BIGINT UNSIGNED NOT NULL,
    `note` TEXT NOT NULL,
    `created_by` BIGINT UNSIGNED NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `lead_id`(`lead_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_queries` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `lead_id` INTEGER UNSIGNED NOT NULL,
    `query_code` VARCHAR(50) NULL,
    `subject` VARCHAR(255) NOT NULL,
    `category` ENUM('payment', 'technical', 'academic', 'general', 'other') NULL DEFAULT 'general',
    `priority` ENUM('low', 'medium', 'high', 'urgent') NULL DEFAULT 'medium',
    `status` ENUM('open', 'in_progress', 'resolved', 'closed', 'reopened') NULL DEFAULT 'open',
    `assigned_to` INTEGER UNSIGNED NULL,
    `created_by` ENUM('student', 'admin') NULL DEFAULT 'student',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `closed_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `query_code`(`query_code`),
    INDEX `assigned_to`(`assigned_to`),
    INDEX `lead_id`(`lead_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_query_messages` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `query_id` INTEGER UNSIGNED NOT NULL,
    `sender_type` ENUM('student', 'admin') NOT NULL,
    `sender_id` INTEGER UNSIGNED NULL,
    `message` TEXT NOT NULL,
    `is_internal` BOOLEAN NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `query_id`(`query_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_saved_filters` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `institute_id` BIGINT UNSIGNED NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `filters_json` LONGTEXT NULL,
    `columns_json` LONGTEXT NULL,
    `sort_json` LONGTEXT NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `organization_id` INTEGER NOT NULL DEFAULT 0,

    INDEX `idx_default`(`is_default`),
    INDEX `idx_institute_id`(`institute_id`),
    INDEX `idx_user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_settings` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `organization_id` INTEGER NOT NULL,
    `role_slug` VARCHAR(50) NOT NULL,
    `field` VARCHAR(50) NOT NULL,
    `can_view` BOOLEAN NULL DEFAULT false,
    `can_download` BOOLEAN NULL DEFAULT false,
    `can_edit` BOOLEAN NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `unique_role_field`(`organization_id`, `role_slug`, `field`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_sources` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `status` BOOLEAN NULL DEFAULT true,
    `lead_count` INTEGER NULL DEFAULT 0,
    `billing_setup_amount` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `total_amount` DECIMAL(10, 2) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_statuses` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NULL,
    `name` VARCHAR(255) NOT NULL,
    `color` VARCHAR(50) NULL,
    `sort_order` INTEGER NULL DEFAULT 0,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `organization_id`(`organization_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_sub_statuses` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `lead_status_id` BIGINT UNSIGNED NOT NULL,
    `organization_id` BIGINT UNSIGNED NULL,
    `name` VARCHAR(255) NOT NULL,
    `sort_order` INTEGER NULL DEFAULT 0,
    `is_active` BOOLEAN NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `color` VARCHAR(255) NULL,

    INDEX `lead_sub_statuses_status_fk`(`lead_status_id`),
    INDEX `organization_id`(`organization_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_types` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `status` INTEGER NOT NULL DEFAULT 1,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_uploads` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `file_name` VARCHAR(255) NULL,
    `file_path` VARCHAR(500) NULL,
    `total_rows` INTEGER NOT NULL DEFAULT 0,
    `valid_rows` INTEGER NOT NULL DEFAULT 0,
    `duplicate_rows` INTEGER NOT NULL DEFAULT 0,
    `failed_rows` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(30) NOT NULL DEFAULT 'pending',
    `started_at` DATETIME(0) NULL,
    `completed_at` DATETIME(0) NULL,
    `error_message` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `upload_type` VARCHAR(255) NULL,
    `institute` VARCHAR(255) NULL,
    `program` VARCHAR(255) NULL,
    `course` VARCHAR(255) NULL,
    `assign_user` VARCHAR(255) NULL,
    `assigni` VARCHAR(255) NULL,

    INDEX `idx_org`(`organization_id`),
    INDEX `idx_status`(`status`),
    INDEX `idx_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_verifications` (
    `lead_id` BIGINT NOT NULL,
    `sms_verified` TINYINT NULL DEFAULT 0,
    `email_verified` TINYINT NULL DEFAULT 0,
    `verified_at` DATETIME(0) NULL,

    PRIMARY KEY (`lead_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lead_webhook_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NULL,
    `provider` ENUM('facebook', 'instagram', 'google') NOT NULL,
    `event_type` VARCHAR(100) NULL,
    `request_headers` LONGTEXT NULL,
    `payload` LONGTEXT NOT NULL,
    `is_processed` BOOLEAN NULL DEFAULT false,
    `error_message` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leads` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NULL,
    `mobile` VARCHAR(20) NOT NULL,
    `alternate_mobile` VARCHAR(20) NULL,
    `email` VARCHAR(150) NULL,
    `city` VARCHAR(100) NULL,
    `state` VARCHAR(255) NULL,
    `country` VARCHAR(100) NULL,
    `organization_id` BIGINT NOT NULL,
    `institute_id` BIGINT UNSIGNED NULL,
    `programme_id` BIGINT UNSIGNED NULL,
    `faculty_id` BIGINT UNSIGNED NULL,
    `application_form_id` INTEGER NULL,
    `lead_source_id` BIGINT NULL,
    `lead_campaign_id` BIGINT NULL,
    `lead_marketing_event` INTEGER NULL,
    `pipeline_id` BIGINT NULL,
    `stage_id` BIGINT NULL,
    `type_id` BIGINT NULL,
    `lead_status_id` BIGINT NULL,
    `lead_sub_status_id` BIGINT NULL,
    `lead_score` INTEGER NULL DEFAULT 0,
    `lead_weight_count` INTEGER NULL DEFAULT 0,
    `lead_assign_to` BIGINT NULL,
    `created_by` BIGINT NULL,
    `next_followup_at` DATETIME(0) NULL,
    `lead_registration_date` DATETIME(0) NULL,
    `extra_fields_json` LONGTEXT NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `password` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `marketing_events` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `description` VARCHAR(255) NOT NULL,
    `date` DATE NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `organization_id` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `message_templates` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `created_by` BIGINT UNSIGNED NOT NULL,
    `send_by` VARCHAR(50) NULL,
    `title` VARCHAR(255) NULL,
    `category` VARCHAR(100) NULL,
    `message` LONGTEXT NOT NULL,
    `variables_json` LONGTEXT NULL,
    `editable` BOOLEAN NOT NULL DEFAULT true,
    `sent_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `migrations` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `migration` VARCHAR(255) NOT NULL,
    `batch` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifications` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `user_id` BIGINT UNSIGNED NOT NULL,
    `type` ENUM('message', 'alert') NOT NULL DEFAULT 'alert',
    `title` VARCHAR(255) NOT NULL,
    `body` TEXT NULL,
    `url` VARCHAR(500) NULL,
    `is_read` TINYINT NOT NULL DEFAULT 0,
    `read_at` TIMESTAMP(0) NULL,
    `ref_type` VARCHAR(100) NULL,
    `ref_id` BIGINT UNSIGNED NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `idx_notifications_is_read`(`is_read`),
    INDEX `idx_notifications_org`(`organization_id`),
    INDEX `idx_notifications_type`(`type`),
    INDEX `idx_notifications_user`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `org_activity_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `entity_type` VARCHAR(255) NULL,
    `entity_id` BIGINT UNSIGNED NULL,
    `action` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `meta_data` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `organizations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `email` VARCHAR(255) NULL,
    `mobile` VARCHAR(255) NULL,
    `address` VARCHAR(255) NULL,
    `city` VARCHAR(255) NULL,
    `state` VARCHAR(255) NULL,
    `zipcode` VARCHAR(255) NULL,
    `country` VARCHAR(255) NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `logo` VARCHAR(255) NULL,
    `gst` VARCHAR(255) NULL,
    `created_by` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `otp_verifications` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `type` ENUM('email', 'mobile') NOT NULL,
    `recipient` VARCHAR(150) NOT NULL,
    `otp_code` VARCHAR(10) NOT NULL,
    `expires_at` DATETIME(0) NOT NULL,
    `is_verified` BOOLEAN NULL DEFAULT false,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_reset_tokens` (
    `email` VARCHAR(255) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`email`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `persistences` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `persistences_code_unique`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pipeline_stages` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(255) NULL,
    `name` VARCHAR(255) NULL,
    `probability` INTEGER NOT NULL DEFAULT 0,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `lead_pipeline_id` INTEGER UNSIGNED NOT NULL,
    `is_final` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `lead_pipeline_stages_lead_pipeline_id_foreign`(`lead_pipeline_id`),
    UNIQUE INDEX `lead_pipeline_stages_code_lead_pipeline_id_unique`(`code`, `lead_pipeline_id`),
    UNIQUE INDEX `lead_pipeline_stages_name_lead_pipeline_id_unique`(`name`, `lead_pipeline_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pipelines` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `rotten_days` INTEGER NOT NULL DEFAULT 30,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `organization_id` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `lead_pipelines_name_unique`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_activities` (
    `activity_id` INTEGER UNSIGNED NOT NULL,
    `product_id` INTEGER UNSIGNED NOT NULL,

    INDEX `product_activities_activity_id_foreign`(`activity_id`),
    INDEX `product_activities_product_id_foreign`(`product_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_inventories` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `in_stock` INTEGER NOT NULL DEFAULT 0,
    `allocated` INTEGER NOT NULL DEFAULT 0,
    `product_id` INTEGER UNSIGNED NOT NULL,
    `organization_id` INTEGER UNSIGNED NULL,
    `organization_location_id` INTEGER UNSIGNED NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `product_inventories_product_id_foreign`(`product_id`),
    INDEX `product_inventories_warehouse_id_foreign`(`organization_id`),
    INDEX `product_inventories_warehouse_location_id_foreign`(`organization_location_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_tags` (
    `tag_id` INTEGER UNSIGNED NOT NULL,
    `product_id` INTEGER UNSIGNED NOT NULL,

    INDEX `product_tags_product_id_foreign`(`product_id`),
    INDEX `product_tags_tag_id_foreign`(`tag_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `sku` VARCHAR(255) NOT NULL,
    `name` VARCHAR(255) NULL,
    `description` VARCHAR(255) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 0,
    `price` DECIMAL(12, 4) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `organization_id` INTEGER NOT NULL DEFAULT 0,
    `program_id` BIGINT UNSIGNED NULL,
    `status` INTEGER NOT NULL DEFAULT 1,

    UNIQUE INDEX `products_sku_unique`(`sku`),
    INDEX `products_program_id_fk`(`program_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `programs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `institute_id` BIGINT UNSIGNED NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `status` TINYINT NULL DEFAULT 1,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `registers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `avatar` TEXT NULL,
    `user_type` VARCHAR(255) NOT NULL,
    `first_name` VARCHAR(255) NULL,
    `last_name` VARCHAR(255) NULL,
    `email` VARCHAR(50) NOT NULL,
    `mobile` VARCHAR(12) NULL,
    `user_name` VARCHAR(255) NULL,
    `address` TEXT NULL,
    `notes` TEXT NULL,
    `organization` VARCHAR(10) NULL,
    `designation` VARCHAR(10) NULL,
    `team` VARCHAR(255) NULL,
    `status` INTEGER NULL,
    `created_at` DATETIME(0) NOT NULL,
    `updated_at` DATETIME(0) NOT NULL,
    `is_available_for_leads` INTEGER NOT NULL DEFAULT 0,
    `role` VARCHAR(255) NULL,
    `other_org` VARCHAR(255) NULL,

    INDEX `First_Name`(`first_name`, `last_name`, `mobile`),
    INDEX `email`(`email`),
    INDEX `user_id`(`user_id`),
    INDEX `user_id_2`(`user_id`, `first_name`, `last_name`, `email`, `mobile`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reminders` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `completed_at` TIMESTAMP(0) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `user_id`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `role_users` (
    `user_id` INTEGER UNSIGNED NOT NULL,
    `role_id` INTEGER UNSIGNED NOT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    PRIMARY KEY (`user_id`, `role_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `permissions` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,

    UNIQUE INDEX `roles_slug_unique`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sessions` (
    `id` VARCHAR(255) NOT NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `payload` LONGTEXT NOT NULL,
    `last_activity` INTEGER NOT NULL,

    INDEX `sessions_last_activity_index`(`last_activity`),
    INDEX `sessions_user_id_index`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sms_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `communication_log_id` BIGINT NULL,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `lead_id` BIGINT UNSIGNED NULL,
    `mobile` VARCHAR(20) NOT NULL,
    `message` TEXT NOT NULL,
    `provider` VARCHAR(255) NULL DEFAULT 'demo',
    `provider_message_id` VARCHAR(100) NULL,
    `status` VARCHAR(20) NULL DEFAULT 'pending',
    `response_json` TEXT NULL,
    `sent_by` BIGINT UNSIGNED NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,
    `full_url` TEXT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `sent_at` DATETIME(0) NULL,
    `last_attempt_at` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sms_settings` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NULL,
    `provider` VARCHAR(50) NULL,
    `api_key` TEXT NULL,
    `sender_id` VARCHAR(20) NULL,
    `route` VARCHAR(20) NULL,
    `status` TINYINT NULL DEFAULT 1,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `api_url` VARCHAR(255) NULL,
    `http_method` ENUM('GET', 'POST') NULL DEFAULT 'GET',
    `mobile_param` VARCHAR(50) NULL,
    `message_param` VARCHAR(50) NULL,
    `extra_params` TEXT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `states` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `country_id` INTEGER NOT NULL DEFAULT 0,
    `name` VARCHAR(255) NULL,
    `created_at` INTEGER NOT NULL DEFAULT (current_timestamp()),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tags` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `organization_id` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_by` INTEGER NOT NULL DEFAULT 0,
    `color` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teams` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `organization_id` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `status` INTEGER NOT NULL DEFAULT 0,
    `created_by` INTEGER NOT NULL DEFAULT 0,
    `head` INTEGER NOT NULL DEFAULT 0,
    `team_member` TEXT NULL,
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `throttle` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER UNSIGNED NULL,
    `type` VARCHAR(191) NOT NULL,
    `ip` VARCHAR(191) NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,

    INDEX `throttle_user_id_index`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `user_activity_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `entity_type` VARCHAR(100) NULL,
    `entity_id` BIGINT UNSIGNED NULL,
    `action` VARCHAR(100) NULL,
    `description` TEXT NULL,
    `meta_data` LONGTEXT NULL,
    `ip_address` VARCHAR(50) NULL,
    `device` TEXT NULL,
    `browser` TEXT NULL,
    `os` TEXT NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `permissions` TEXT NULL,
    `last_login` TIMESTAMP(0) NULL,
    `first_name` VARCHAR(191) NULL,
    `last_name` VARCHAR(191) NULL,
    `location` VARCHAR(255) NULL,
    `created_at` DATETIME(0) NULL,
    `updated_at` DATETIME(0) NULL,
    `status` INTEGER NULL DEFAULT 1,

    UNIQUE INDEX `users_email_unique`(`email`),
    INDEX `email`(`email`, `first_name`, `last_name`),
    INDEX `first_name`(`first_name`, `last_name`, `location`(191)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `web_form_attributes` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `placeholder` VARCHAR(255) NULL,
    `is_required` BOOLEAN NOT NULL DEFAULT false,
    `is_hidden` BOOLEAN NOT NULL DEFAULT false,
    `sort_order` INTEGER NULL DEFAULT 0,
    `web_form_id` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `type` VARCHAR(255) NULL,
    `options` VARCHAR(255) NULL,
    `default_value` TEXT NULL,
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `created_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `form_id` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `web_forms` (
    `id` INTEGER UNSIGNED NOT NULL AUTO_INCREMENT,
    `form_id` VARCHAR(255) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `submit_button_label` TEXT NOT NULL,
    `submit_success_action` VARCHAR(255) NOT NULL,
    `submit_success_content` VARCHAR(255) NOT NULL,
    `create_lead` BOOLEAN NOT NULL DEFAULT false,
    `background_color` VARCHAR(255) NULL,
    `form_background_color` VARCHAR(255) NULL,
    `form_title_color` VARCHAR(255) NULL,
    `form_submit_button_color` VARCHAR(255) NULL,
    `attribute_label_color` VARCHAR(255) NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `organization_id` INTEGER NOT NULL DEFAULT 0,
    `view_count` INTEGER NOT NULL DEFAULT 0,
    `submit_count` INTEGER NOT NULL DEFAULT 0,
    `lead_source_id` INTEGER NOT NULL DEFAULT 0,
    `lead_campaign_id` INTEGER NOT NULL DEFAULT 0,
    `pipeline_id` INTEGER NOT NULL DEFAULT 0,
    `type_id` INTEGER NOT NULL DEFAULT 0,
    `attr_programme_check` VARCHAR(255) NULL,
    `extra_fields_json` TEXT NULL,
    `created_by` INTEGER NOT NULL DEFAULT 0,
    `application_form_id` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `webhooks` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `entity_type` VARCHAR(255) NOT NULL,
    `description` VARCHAR(255) NULL,
    `method` VARCHAR(255) NOT NULL,
    `end_point` VARCHAR(255) NOT NULL,
    `query_params` LONGTEXT NULL,
    `headers` LONGTEXT NULL,
    `payload_type` VARCHAR(255) NOT NULL,
    `raw_payload_type` VARCHAR(255) NOT NULL,
    `payload` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NULL,
    `updated_at` TIMESTAMP(0) NULL,
    `organization_id` INTEGER NOT NULL DEFAULT 0,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `whatsapp_logs` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `communication_log_id` BIGINT NULL,
    `organization_id` BIGINT UNSIGNED NOT NULL DEFAULT 0,
    `lead_id` BIGINT UNSIGNED NULL,
    `mobile` VARCHAR(20) NULL,
    `template_id` VARCHAR(100) NULL,
    `message` TEXT NULL,
    `media_url` TEXT NULL,
    `provider` VARCHAR(50) NULL DEFAULT 'demo',
    `provider_message_id` VARCHAR(100) NULL,
    `status` VARCHAR(20) NULL DEFAULT 'pending',
    `response_json` TEXT NULL,
    `sent_by` BIGINT UNSIGNED NULL,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `sent_at` DATETIME(0) NULL,
    `last_attempt_at` DATETIME(0) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `whatsapp_settings` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `provider` VARCHAR(50) NULL DEFAULT 'demo',
    `api_key` TEXT NULL,
    `sender_number` VARCHAR(30) NULL,
    `template_namespace` VARCHAR(100) NULL,
    `status` TINYINT NULL DEFAULT 1,
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `provider_url` VARCHAR(255) NULL,
    `username` VARCHAR(255) NULL,
    `password` VARCHAR(255) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `whatsapp_templates` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `organization_id` BIGINT UNSIGNED NOT NULL,
    `created_by` BIGINT UNSIGNED NOT NULL,
    `send_by` VARCHAR(50) NULL,
    `title` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) NULL,
    `message` LONGTEXT NOT NULL,
    `variables_json` LONGTEXT NULL,
    `editable` BOOLEAN NOT NULL DEFAULT true,
    `sent_count` INTEGER UNSIGNED NOT NULL DEFAULT 0,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `application_form_responses` ADD CONSTRAINT `fk_responses_form` FOREIGN KEY (`lead_form_id`) REFERENCES `application_forms`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `campaigns` ADD CONSTRAINT `marketing_campaigns_marketing_event_id_foreign` FOREIGN KEY (`marketing_event_id`) REFERENCES `marketing_events`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `campaigns` ADD CONSTRAINT `marketing_campaigns_marketing_template_id_foreign` FOREIGN KEY (`marketing_template_id`) REFERENCES `email_templates`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `landing_page_sections` ADD CONSTRAINT `fk_lps_page` FOREIGN KEY (`page_id`) REFERENCES `landing_pages`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `lead_distribution_rule_items` ADD CONSTRAINT `ldr_items_rule_fk` FOREIGN KEY (`rule_id`) REFERENCES `lead_distribution_rules`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `lead_sub_statuses` ADD CONSTRAINT `lead_sub_statuses_status_fk` FOREIGN KEY (`lead_status_id`) REFERENCES `lead_statuses`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_program_id_fk` FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;
