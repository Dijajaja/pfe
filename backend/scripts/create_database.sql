-- À exécuter en tant que superutilisateur PostgreSQL (souvent l'utilisateur "postgres").
-- Exemple (PowerShell, depuis le dossier backend) :
--   $env:PGPASSWORD = "votre_mot_de_passe"
--   & "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -h 127.0.0.1 -p 5432 -d postgres -f scripts/create_database.sql
--
-- Si la base existe déjà, vous obtiendrez une erreur "already exists" : c'est normal.

CREATE DATABASE cnou_bourses
    WITH ENCODING 'UTF8'
    TEMPLATE template0;
