import React, { useState, useEffect } from "react";
import "./SIDGenerator.css";

const SidGen = props => {
   // Setters are from App.js because App.js is the lowest common ancestor
   // to SidGen.js siblings components that need the SID
   const {
      setSESSION_ID,
      SESSION_ID,
      setStackChoice,
      stackChoice,
      setEMAIL,
      EMAIL,
      setPASSWORD,
      PASSWORD,
      // setRenderAccountsList,
      // setRenderLoginBox,
      setFinished_fetch,
      // setCurrentAccount,
   } = props;

   const [SID, setSID] = useState("");

   // Upon page load populate state with SID (passed down to here from fetchSESSION_ID via App.js)
   useEffect(() => {
      setSID(SESSION_ID);
      if (SESSION_ID && SESSION_ID?.length > 0) {
         session_refresher();
      }
      // eslint-disable-next-line
   }, [SID]);

   const session_refresher = () => {
      if (SID?.length > 0) {
         setInterval(() => {
            setFinished_fetch(false);
            const CORS_ANYWHERE_PREFIX = "https://sleepy-fjord-70300.herokuapp.com/";
            const options = {
               method: "POST",
               body: encodeURI(`login=${EMAIL}&password=${PASSWORD}&validate_session=${SESSION_ID}`),
               headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
               },
            };
            fetch(`${CORS_ANYWHERE_PREFIX}https://cloud.cimar.co.uk/api/v3/session/login`, options)
               .then(resp => resp.json())
               .then(data => {
                  console.log(`refreshed: ${data.sid}`);
                  setSESSION_ID(data.sid);
                  setSID(data.sid);
                  setFinished_fetch(true);
                  setTimeout(() => {
                     if (data.sid) {
                        // setRenderLoginBox(false);
                     }
                     if (!data.sid) {
                        alert(`Please check your login credentials`);
                     }
                  }, 1500);
               });
         }, 15000);
      }
   };

   const fetchSESSION_ID = () => {
      setFinished_fetch(false);
      // setCurrentAccount({});
      const CORS_ANYWHERE_PREFIX = "https://sleepy-fjord-70300.herokuapp.com/";
      const options = {
         method: "POST",
         body: encodeURI(`login=${EMAIL}&password=${PASSWORD}`),
         headers: {
            "Content-Type": "application/x-www-form-urlencoded",
         },
      };
      fetch(`${CORS_ANYWHERE_PREFIX}https://cloud.cimar.co.uk/api/v3/session/login`, options)
         .then(resp => resp.json())
         .then(data => {
            console.log(`${EMAIL}\n${data.sid}`);
            setSESSION_ID(data.sid);
            setFinished_fetch(true);
            // setRenderAccountsList(true);
            setTimeout(() => {
               if (data.sid) {
                  // setRenderLoginBox(false);
               }
               if (!data.sid) {
                  alert(`Please check your login credentials`);
               }
            }, 1500);
         });
   };

   const cloudAccessChangeHandler = event => {
      setStackChoice(event.target.value);
   };

   return (
      <div className='sidGenWrapper slide-in-bottom '>
         <form action='submit' className='' onSubmit={() => fetchSESSION_ID()}>
            <input
               type='text'
               className='credentialsInput'
               id='credentialsInput'
               placeholder='Email'
               onChange={e => setEMAIL(e.target.value)}
               value={EMAIL}
            />
            <input
               type='password'
               className='credentialsInput'
               placeholder='Password'
               id='credentialsInput'
               value={PASSWORD}
               onChange={e => setPASSWORD(e.target.value)}
               // onSubmit={fetchSESSION_ID}
            />
         </form>
         {SESSION_ID && (
            <div className='SESSION_IDDisplay'>
               <p>SID:{SESSION_ID}</p>
            </div>
         )}
         <div className='optionsWrapper'>
            <select
               name='stackDropdown'
               id=''
               className='stackDropdown'
               onChange={e => cloudAccessChangeHandler(e)}
               value={stackChoice}>
               <option value='cloud' className='stackOption cloudStack'>
                  Cloud
               </option>
               <option value='access' className='stackOption accessStack'>
                  Access
               </option>
            </select>
            <div className='getSESSION_IDBtn' onClick={fetchSESSION_ID}>
               {SESSION_ID ? "Refresh" : "Sign In"}
            </div>
         </div>
      </div>
   );
};

export default SidGen;
