// const BMI_ACCOUNT_ID = `3b4acdf9-7f2c-4cbe-93a9-e658aca12682`;
// const USER_GET = `user/get`;
const API_BASE = `https://cloud.cimar.co.uk/api/v3/`;
const ACCOUNT_USER_LIST = `account/user/list`;
const AUDIT_DELETED = `audit/deleted`;
const AUDIT_OBJECT = `audit/object`;
const ACCOUNT_GET = `account/get`;
const STUDY_LIST = `study/list`;

const get_account = async (ACCOUNT_ID, SESSION_ID) => {
   const raw_resp = await fetch(`${API_BASE}${ACCOUNT_GET}?sid=${SESSION_ID}&uuid=${ACCOUNT_ID}`);
   const JSON_resp = await raw_resp.json();
   return JSON_resp;
};

const get_account_users = async (ACCOUNT_ID, SESSION_ID) => {
   const raw_resp = await fetch(`${API_BASE}${ACCOUNT_USER_LIST}?sid=${SESSION_ID}&uuid=${ACCOUNT_ID}`);
   const JSON_resp = await raw_resp.json();
   return JSON_resp.users;
};

const get_live_studies = async (ACCOUNT_ID, SESSION_ID, REPORTED_ONLY_BOOLEAN = false) => {
   let reported_or_all_studies = REPORTED_ONLY_BOOLEAN ? `&filter.attachment_count.gt=0` : ``;
   const raw_resp = await fetch(
      `${API_BASE}${STUDY_LIST}?sid=${SESSION_ID}&filter.account_id.equals=${ACCOUNT_ID}&filter.created.gt=2020-01-01${reported_or_all_studies}&page.rows=50`
   );
   const JSON_resp = await raw_resp.json();
   return JSON_resp.studies;
};

const get_purged_studies = async (ACCOUNT_ID, SESSION_ID) => {
   const raw_resp = await fetch(
      `${API_BASE}${AUDIT_DELETED}?sid=${SESSION_ID}&account_id=${ACCOUNT_ID}&type=Study&page.rows=50`
   );
   const JSON_resp = await raw_resp.json();
   return JSON_resp.objects;
};

const audit_study = async (ACCOUNT_ID, SESSION_ID, STUDY_UUID) => {
   const raw_resp = await fetch(`${API_BASE}${AUDIT_OBJECT}?sid=${SESSION_ID}&uuid=${STUDY_UUID}`);
   const JSON_resp = await raw_resp.json();
   return JSON_resp.events;
};


const exportObj = {
   get_account,
   get_account_users,
   get_live_studies,
   get_purged_studies,
   audit_study,
};

export default exportObj