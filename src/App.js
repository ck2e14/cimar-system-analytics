import "./App.css";
import React, { useState, useEffect } from "react";
import SID_GENERATOR from "./Components/SIDGenerator/SIDGenerator.js";
import API from "./Adapters/API.js";
// import POPUP from "./Components/PopUp/PopUp.js";
import FEEDBACK_BOX from "./Components/FeedbackBox/FeedbackBox.js";

// *****************************************  - -  R E A D    M E  - -  ****************************************
// 1. get_busiest_rad_reporter gets and manages study and user data from account
// 2. useEffect triggers audits when state is ready
// 3. each audit response is fed into check_report_count_and_attribute_to_user
// 4. use objects in state get incremented each time a qualifying condition is met

// TODO: Put the rad_reporter stuff in its own file else this will get too congested with future analytics functions
// TODO: Currently getting report count from audit to study UUID from main list - a probably better way is to
//       get all groups and locations (because reported in there) and use study UUIDs from there - that way
//       the audit trail has an actual 'generated report' entry not just an indirect reference to it happening
//       back in the main org namespace (i.e. attachment count incrementing).
//       This is mostly fine but if there are multiple reports (rare) attached to a study (e.g. addenda) and
//       those were submitted by different rads, it will attribute all the report count for the study
//       to the rad who reported most recently. This will get fixed by going through the version of the study
//       from the namespace it actually got reported in. Req's work.
// TODO: Need to check that it only counts 1 copy of a study i.e. doesn't count the same report synced across §multiple shared versions of a study (i.e. rad bucket routing)
// *****************************************  - -  R E A D    M E  - -  ****************************************

const App = () => {
   // BMI
   const [ACCOUNT_UUID, setACCOUNT_UUID] = useState(`3b4acdf9-7f2c-4cbe-93a9-e658aca12682`);
   // const [ACCOUNT_UUID, setACCOUNT_UUID] = useState(`72ad8de3-a873-45ef-a107-d43c3f050369`);
   // CK
   const [SESSION_ID, setSESSION_ID] = useState(null);
   const [PASSWORD, setPASSWORD] = useState("12newpassword");
   const [EMAIL, setEMAIL] = useState("C.kennedy@cimar.co.uk");
   const [CURRENT_ACCOUNT, setCURRENT_ACCOUNT] = useState();
   const [CURRENT_ACCOUNT_USER_LIST, setCURRENT_ACCOUNT_USER_LIST] = useState({});
   const [CURRENT_ACCOUNT_STUDIES, setCURRENT_ACCOUNT_STUDIES] = useState();
   const [finished_fetch, setFinished_fetch] = useState(true);
   const [fetched_live_studies, setFetched_live_studies] = useState(false);
   const [fetched_deleted_studies, setFetched_deleted_studies] = useState(false);
   const [fetched_users, setFetched_users] = useState(false);
   const [cancel_useEffect, setCancel_useEffect] = useState(false);
   // eslint-disable-next-line
   const [feedback, setFeedback] = useState([""]);

   var date = new Date();
   var str = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();

   useEffect(() => {
      const app_DOM = document.getElementById("App");
      if (!finished_fetch) {
         app_DOM.classList.add("async-pending-cursor");
      } else if (finished_fetch) {
         app_DOM.classList.remove("async-pending-cursor");
      }
   }, [finished_fetch]);

   // This fires when anything in CURRENT_ACCOUNT_STUDIES changes. It runs the if statement and fires the audit/objects if ready
   useEffect(() => {
      if (
         finished_fetch &&
         fetched_users &&
         fetched_live_studies &&
         fetched_deleted_studies &&
         !cancel_useEffect
      ) {
         trigger_audit_queue();
         setCancel_useEffect(true);
      }
      // eslint-disable-next-line
   }, [CURRENT_ACCOUNT_STUDIES]);

   const get_account_handler = async () => {
      !SESSION_ID && alert("Please sign in first.");
      const current_account = await API.get_account(ACCOUNT_UUID, SESSION_ID);
      setCURRENT_ACCOUNT(current_account);
   };

   const get_busiest_rad_reporter = async () => {
      if (!CURRENT_ACCOUNT) {
         return alert("Please first fetch an account using their UUID.");
      }
      setFinished_fetch(false);

      //A//   *** FETCHES ***
      //1// ACCOUNT/GET
      feedback.push(`${str}: Fetching ${CURRENT_ACCOUNT.name}'s users...`);
      const list_of_account_users = await API.get_account_users(ACCOUNT_UUID, SESSION_ID);
      console.table(list_of_account_users);
      console.log(`Fetched ${CURRENT_ACCOUNT.name}'s users (ABOVE)\n(MAKE CONSOLE FULLSCREEN)`);
      feedback.push(`${str}: Fetched ${CURRENT_ACCOUNT.name}'s users.`);
      feedback.push(`${str}: Fetching ${CURRENT_ACCOUNT.name}'s live studies...`);
      setFetched_users(true);

      //2// LIVE STUDIES/GET
      const live_studies = await API.get_live_studies(ACCOUNT_UUID, SESSION_ID, true);
      console.table(live_studies);
      console.log(`Fetched ${CURRENT_ACCOUNT.name}'s live studies (ABOVE)\n(MAKE CONSOLE FULLSCREEN)`);
      feedback.push(`${str}: Fetched ${CURRENT_ACCOUNT.name}'s live studies.`);
      feedback.push(`${str}: Fetching ${CURRENT_ACCOUNT.name}'s deleted studies...`);
      setFetched_live_studies(true);

      //3// DELETED STUDIES/GET
      const deleted_studies = await API.get_purged_studies(ACCOUNT_UUID, SESSION_ID);
      console.table(deleted_studies);
      console.log(`Fetched ${CURRENT_ACCOUNT.name}'s deleted studies (ABOVE)\n(MAKE CONSOLE FULLSCREEN)`);
      feedback.push(`${str}: Fetched ${CURRENT_ACCOUNT.name}'s deleted studies.`);
      setFetched_deleted_studies(true);
      setFinished_fetch(true);

      //B//  *** RETURNED-DATA HANDLING ***
      //1// CREATE USER OBJECTS TO APPEND USAGE DATA
      const user_holding_pen = [];
      list_of_account_users.map(user => {
         return user_holding_pen.push({
            USERNAME: user.user_name,
            EMAIL: user.user_email,
            USER_ID: user.user_id,
            ROLE: user.role_name,
            NUMBER_OF_REPORTS_ATTACHED: 0,
         });
      });
      setCURRENT_ACCOUNT_USER_LIST(user_holding_pen);

      //2// STUDIES
      // Make study objects with uniform structure Live vs Deleted
      const live_studies_holding_pen = [];
      const processed_live_and_deleted_studies = [];
      live_studies.map(live_study => {
         return live_studies_holding_pen.push({
            STUDY_UUID: live_study.uuid,
            ATTACHMENT_COUNT: live_study.attachment_count,
            NAMESPACE: live_study.phi_namespace_name,
            THIN: live_study.thin === 1 ? "TRUE" : "FALSE",
            FROM: "Live",
         });
      });
      // Make study objects with uniform structure Live vs Deleted
      const deleted_studies_holding_pen = [];
      deleted_studies.map(deleted_study => {
         return deleted_studies_holding_pen.push({
            STUDY_UUID: deleted_study.uuid,
            ATTACHMENT_COUNT: "Unknown - deleted study",
            NAMESPACE: "Unknown- deleted study",
            THIN: "Unknown - deleted study",
            FROM: "Deleted",
         });
      });

      // Concat the two study holding pens & push as a single setState into CURRENT_ACCOUNT_STUDIES
      // (Watched by useEffect which should fire only once per script execution so single setState is safest)
      processed_live_and_deleted_studies.push(...live_studies_holding_pen, ...deleted_studies_holding_pen);
      setCURRENT_ACCOUNT_STUDIES(processed_live_and_deleted_studies);
   };

   const trigger_audit_queue = async () => {
      //  TODO: audit/object over every study uuid.
      //  Map through the events in the response looking for radreport_create (or something)
      //  From that event, take the 'WHO' and look through state for that user. If you find it increment the counter.
      for (let i = 0; i < CURRENT_ACCOUNT_STUDIES.length; i++) {
         const audit_response = await API.audit_study(
            CURRENT_ACCOUNT.uuid,
            SESSION_ID,
            CURRENT_ACCOUNT_STUDIES[i].STUDY_UUID
         );
         check_report_count(audit_response, CURRENT_ACCOUNT_STUDIES[i]);
         await waitForMe(300);
      }
   };

   const check_report_count = async (audit_response, STUDY) => {
      // Iterate over events array for the passed audit_response looking for first instance of detail.attachment_count
      // If a deleted study, the first instance it will find is from the DELETE study audit event.
      // This is fine but the 'who' on that event is System not a user. So we ignore that event and
      // go to the same audit event as the live studies.
      return audit_response.some(audit_event => {
         if (
            // skip this audit_event if it doesn't have the right info
            !audit_event.detail ||
            !audit_event.detail?.attachment_count ||
            typeof audit_event.detail.attachment_count === "number"
         ) {
            return false;
         } else {
            // For this study, pass the # reports, who reported, and the study object to attribute_to_user()-
            // Return true to satisfy .some() break condition. I.e. found the attachment count for study so move on
            attribute_to_user(audit_event.detail.attachment_count[1], audit_event, STUDY);
            return true;
         }
      });
   };

   const attribute_to_user = (num_to_increment_by, audit_event, STUDY) => {
      console.log(STUDY.FROM, num_to_increment_by, audit_event.who, STUDY.STUDY_UUID);

      // eslint-disable-next-line
      return CURRENT_ACCOUNT_USER_LIST.map(user => {
         if (user.USERNAME === audit_event.who) {
            user.NUMBER_OF_REPORTS_ATTACHED = user.NUMBER_OF_REPORTS_ATTACHED += parseInt(
               num_to_increment_by
            );
            user.USER_REPORTED_STUDY_IDs = STUDY;
         }
      });
   };

   const test_the_counts = () => {
      // eslint-disable-next-line
      CURRENT_ACCOUNT_USER_LIST.map(user => {
         if (user.NUMBER_OF_REPORTS_ATTACHED > 0) {
            console.log(`${user.USERNAME} ${user.NUMBER_OF_REPORTS_ATTACHED}`);
         }
      });
   };

   const waitForMe = async milisec => {
      return new Promise(resolve => {
         setTimeout(() => {
            resolve("");
         }, milisec);
      });
   };

   return (
      <div className='App' id='App'>
         <div className='feedback_component_wrapper'>
            {feedback.length > 0 && <FEEDBACK_BOX feedback={feedback} />}
         </div>
         {!finished_fetch ? (
            <div className='shader-layer'>
               {" "}
               <div className='lds-ring'>
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
               </div>
            </div>
         ) : null}
         <SID_GENERATOR
            EMAIL={EMAIL}
            PASSWORD={PASSWORD}
            SESSION_ID={SESSION_ID}
            setEMAIL={setEMAIL}
            setPASSWORD={setPASSWORD}
            setSESSION_ID={setSESSION_ID}
            setFinished_fetch={setFinished_fetch}
         />
         <div className='btns-container'>
            <div className='top-bar'>
               <p className='title'>system analytics</p>
               {CURRENT_ACCOUNT ? CURRENT_ACCOUNT.name : null}

               <input
                  value={ACCOUNT_UUID}
                  onChange={e => setACCOUNT_UUID(e.target.value)}
                  type='text'
                  className='account_uuid'
                  placeholder='Target Account UUID'
               />
               <div onClick={() => get_account_handler()} className='btn get-account-btn'>
                  {CURRENT_ACCOUNT ? "Get New Account" : "Get Account"}
                  <br />
               </div>
            </div>

            <div className='btn' onClick={() => get_busiest_rad_reporter()}>
               IDENTIFY MOST ACTIVE REPORTERS
               <br />
               <br />
               <div className='left-align'> By number of reports </div>
            </div>

            <div className='btn' onClick={() => test_the_counts()}>
               C.LOG THE COUNTS
            </div>
         </div>
      </div>
   );
};

export default App;
// 1. get the users in the account and create a user object for each to append analytics to later DONE
// 2. get purged and deleted live_study uuids DONE
// 3. for each uuid make an audit/object call DONE
// 4. take the WHO, and search user objects for that name. DONE
// 5. if you find it increment their reports counter. If not create a reports counter at 1 for them. DONE
// 6. TODO: Disregard studies that have a source of 'shared' - test this is reliable first - do this w/ M
