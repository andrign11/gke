# Firestore Security Specification

## Data Invariants
1. `user_accounts`: Read and write permitted for authenticated administrators or self user record access.
2. `settings`: Public read for church metadata and kop surat; write restricted to authenticated admin users.
3. `penatua_diakon`, `warga_jemaat`, `jadwal_ibadah`, `mph_jemaat`, `inventaris_aset`, `renungan`, `keuangan`: Read permitted for church portal; write allowed for authorized officers/admins.

## Security Rules Design
- Global catch-all default deny.
- Schema validation helpers for basic payloads.
- Role checks for administrative operations.
