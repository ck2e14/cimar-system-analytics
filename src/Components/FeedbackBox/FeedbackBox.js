import React from "react";
import "./FeedbackBox.css";

const FeedbackBox = props => {
   const { feedback } = props;

   if (!feedback || feedback.length < 1) return null;

   const renderFeedbacks = () => {
      return feedback?.map(f => {
         if (f.includes("RM")) {
            // This if block is MFT-HLH specicifc
            return (
               <>
                  <div key={`${f}`}>{`${f}`}</div>
                  <br />
               </>
            );
         }
         return (
            <>
               <li key={`${f}`}>{`${f}`}</li>
               <br />
            </>
         );
      });
   };

   return (
      <div className='feedback_box_wrapper'>
         <p className='title'>LOG</p>
         <ul className=''>{renderFeedbacks()}</ul>
      </div>
   );
};

export default FeedbackBox;
