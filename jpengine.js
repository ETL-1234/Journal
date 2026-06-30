/* ===========================================================
   GUIDANCE ENGINE v1.0
   Shared engine for:
   - jp.html (Period Tracker)
   - jpcard.html (Daily Card)

   Everything cycle-related lives here.
   =========================================================== */

const GuidanceEngine = (() => {

/* ===========================================================
   CONFIG
   =========================================================== */

const SUPABASE_URL =
"https://tppyzexttkuvcobbbmaz.supabase.co";

const SUPABASE_ANON_KEY =
"sb_publishable_VZiTsc0JGVx6tVf2Zu-9uQ_-FwjGpQW";

const SUPABASE_HEADERS = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`
};

const GUIDANCE_CACHE_KEY = "guidance_cache";
const GUIDANCE_CACHE_DATE = "guidance_cache_date";


/* ===========================================================
   GUIDANCE TABLES
   =========================================================== */

const guidanceStart = [
{id:"M1",text:"Energy low. Focus on rest, comfort, and gentle awareness."},
{id:"M2",text:"Continue resting and listening to your body’s needs."},
{id:"M3",text:"Energy may slowly begin returning. Move gently."},
{id:"M4",text:"Light clarity may appear. Keep the pace soft."},
{id:"M5",text:"Transition day. Notice energy beginning to rise again."},
{id:"M6",text:"Energy building. Good day for light planning."},
{id:"M7",text:"Curiosity and motivation may increase today."},
{id:"M8",text:"Mental clarity improving. Explore new ideas."}
];

const guidanceFollicular = [
{id:"F1",text:"Creative thinking and openness may feel natural."},
{id:"F2",text:"Energy building steadily. Take small forward steps."},
{id:"F3",text:"Openness and curiosity may feel stronger."},
{id:"F4",text:"Motivation building. Move ideas forward."},
{id:"F5",text:"Social energy and need for connection may begin to increase."},
{id:"F6",text:"Steady energy. A supportive day for starting tasks."},
{id:"F7",text:"Confidence building. Take meaningful action."},
{id:"F8",text:"Energy continues rising. Communication may feel easier."}
];

const guidanceOvulation = [
{id:"O1",text:"Social and expressive energy may rise."},
{id:"O2",text:"Peak energy window. Connection may feel easier."},
{id:"O3",text:"Energy is strong. Channel it into meaningful action."}
];

const guidanceLuteal = [
{id:"L1",text:"Focused productivity may feel natural today."},
{id:"L2",text:"Steady, grounded energy supports completion."},
{id:"L3",text:"Good day for organization and follow-through."},
{id:"L4",text:"Focus remains steady. Work through practical tasks."},
{id:"L5",text:"Leave breathing room between commitments. Simplify your schedule."},
{id:"L6",text:"Pace yourself and notice changing needs."},
{id:"L7",text:"Gradually slow down if needed. Notice energy shifts."},
{id:"L8",text:"Emotional awareness may increase. Listen inward."}
];

const guidanceEnd = [
{id:"E1",text:"Energy may begin to dip. Prioritize supportive routines."},
{id:"E2",text:"Sensitivity may rise. Protect your energy."},
{id:"E3",text:"A good day to simplify tasks and reduce pressure."},
{id:"E4",text:"Restorative activities and rest may feel especially helpful."},
{id:"E5",text:"Prioritize relaxing activities and supportive routines."},
{id:"E6",text:"Slow down and prepare for a new cycle."},
{id:"E7",text:"Gentle reset. A new cycle may begin soon."}
];


/* ===========================================================
   CACHE
   =========================================================== */

async function loadGuidanceCache(){

    const today = new Date().toISOString().split("T")[0];

    const lastUpdated =
        localStorage.getItem(GUIDANCE_CACHE_DATE);

    if(lastUpdated === today){

        const cached =
            localStorage.getItem(GUIDANCE_CACHE_KEY);

        if(cached){
            return JSON.parse(cached);
        }
    }

    const response = await fetch(

        `${SUPABASE_URL}/rest/v1/phase_guidance?active=eq.true&select=statement_id,version,statement,image_file`,

        {
            headers: SUPABASE_HEADERS
        }

    );

    const rows = await response.json();

    if(Array.isArray(rows) && rows.length){

        localStorage.setItem(
            GUIDANCE_CACHE_KEY,
            JSON.stringify(rows)
        );

        localStorage.setItem(
            GUIDANCE_CACHE_DATE,
            today
        );

        return rows;
    }

    return JSON.parse(
        localStorage.getItem(GUIDANCE_CACHE_KEY) || "[]"
    );

}


/* ===========================================================
   SETTINGS
   =========================================================== */

function cycleLength(){
    return Number(localStorage.getItem("cycle_length") || 28);
}

function periodLength(){
    return Number(localStorage.getItem("period_length") || 5);
}

function lastPeriod(){
    return localStorage.getItem("last_period_start");
}


/* ===========================================================
   CYCLE
   =========================================================== */

function getCycleDay(dateString){

    const lp = lastPeriod();

    if(!lp) return null;

    const diff = Math.floor(
        (new Date(dateString)-new Date(lp))/86400000
    );

    if(diff<0) return null;

    return (diff % cycleLength()) + 1;

}


/* ===========================================================
   PHASE
   =========================================================== */

function getPhase(day){

    if(day===null) return "";

    const ovulationDay = cycleLength()-14;

    const fertileStart = Math.max(1,ovulationDay-5);
    const fertileEnd = Math.min(cycleLength(),ovulationDay-1);

    if(day<=periodLength()) return "menstrual";

    if(day>=fertileStart && day<=fertileEnd)
        return "fertile";

    if(day===ovulationDay)
        return "ovulation";

    if(day<ovulationDay)
        return "follicular";

    const lutealStart=ovulationDay+1;
    const lutealMid=lutealStart+
        Math.floor((cycleLength()-lutealStart+1)/2);

    if(day<lutealMid)
        return "early-luteal";

    return "late-luteal";

}


/* ===========================================================
   DISPLAY HELPERS
   =========================================================== */

function phaseTitle(day){

    switch(getPhase(day)){

        case "menstrual":
            return "Menstrual phase";

        case "follicular":
            return "Follicular phase";

        case "fertile":
            return "Follicular phase";

        case "ovulation":
            return "Ovulation";

        case "early-luteal":
            return "Early luteal phase";

        case "late-luteal":
            return "Late luteal phase";

        default:
            return "";

    }

}

function daysUntilPeriod(day){

    if(day===null) return "";

    const left = cycleLength()-day;

    return left===1
        ? "1 day to your next period"
        : `${left} days to your next period`;

}


/* ===========================================================
   GUIDANCE PICKER
   =========================================================== */

function getGuidanceData(day){

    if(!day) return null;

    const ovulationDay = cycleLength()-14;

    const startLength = guidanceStart.length;
    const endLength = guidanceEnd.length;

    if(day<=startLength)
        return guidanceStart[day-1];

    if(day>cycleLength()-endLength)
        return guidanceEnd[
            day-(cycleLength()-endLength)-1
        ];

    if(day<ovulationDay){

        const dynamicStart=startLength+1;
        const dynamicEnd=ovulationDay-1;

        const index=Math.floor(

            ((day-dynamicStart)/
            (dynamicEnd-dynamicStart+1))
            * guidanceFollicular.length

        );

        return guidanceFollicular[index];

    }

    if(day===ovulationDay){

        const todayKey =
            new Date().toISOString().split("T")[0];

        const storageKey =
            "ovulation_guidance_"+todayKey;

        let index =
            localStorage.getItem(storageKey);

        if(index===null){

            index=Math.floor(
                Math.random()*
                guidanceOvulation.length
            );

            localStorage.setItem(
                storageKey,
                index
            );

        }

        return guidanceOvulation[Number(index)];

    }

    const dynamicStart=ovulationDay+1;
    const dynamicEnd=cycleLength()-endLength;

    const index=Math.floor(

        ((day-dynamicStart)/
        (dynamicEnd-dynamicStart+1))
        * guidanceLuteal.length

    );

    return guidanceLuteal[index];

}


/* ===========================================================
   MASTER UPDATE
   =========================================================== */

async function updateToday(){

    const today =
        new Date().toISOString().split("T")[0];

    const cycleDay =
        getCycleDay(today);

    const guidance =
        getGuidanceData(cycleDay);

    if(!guidance){

        return null;

    }

    localStorage.setItem(
        "current_guidance_id",
        guidance.id
    );

    const cache =
        await loadGuidanceCache();

    const versionKey =
        "guidance_version_"+guidance.id;

    let version =
        Number(localStorage.getItem(versionKey)||1);

    let row =
        cache.find(r=>

            r.statement_id.trim()===guidance.id.trim() &&
            Number(r.version)===version

        );

    if(!row){

        version=1;

        localStorage.setItem(versionKey,1);

        row=
            cache.find(r=>

                r.statement_id.trim()===guidance.id.trim() &&
                Number(r.version)===1

            );

    }

    return {

        cycleDay,

        phase:getPhase(cycleDay),

        phaseTitle:phaseTitle(cycleDay),

        daysUntilPeriod:
            daysUntilPeriod(cycleDay),

        id:guidance.id,

        version,

        text:
            row?.statement || guidance.text,

        image:
            row?.image_file || "",

        raw:guidance

    };

}


/* ===========================================================
   PUBLIC API
   =========================================================== */

return {

    updateToday,

    loadGuidanceCache,

    getCycleDay,

    getPhase,

    phaseTitle,

    daysUntilPeriod,

    getGuidanceData

};

})();
