from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    # Rahasia server untuk menurunkan password Supabase Auth dari kode siswa.
    # JANGAN diubah setelah ada siswa terdaftar (siswa lama tidak akan bisa login).
    student_password_secret: str = ""
    student_email_domain: str = "siswa.squareadventure.id"

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,capacitor://localhost,http://localhost,https://localhost"
    login_rate_limit_per_minute: int = 10

    @property
    def is_configured(self) -> bool:
        return all([self.supabase_url, self.supabase_anon_key,
                    self.supabase_service_role_key, self.student_password_secret])

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
