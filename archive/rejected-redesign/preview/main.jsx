import React from 'react';
import {createRoot} from 'react-dom/client';
import {createPromoOnboarding} from '../src/onboarding.jsx';
import '../src/onboarding.css';
const Onboarding=createPromoOnboarding(React);
createRoot(document.getElementById('root')).render(<Onboarding onComplete={()=>{document.getElementById('preview-toast').style.display='flex';}}/>);
