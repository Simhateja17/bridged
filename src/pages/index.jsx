import Layout from "./Layout.jsx";

import Home from "./Home";

import Athletes from "./Athletes";

import Companies from "./Companies";

import Partners from "./Partners";

import Opportunities from "./Opportunities";

import About from "./About";

import ContentProposal from "./ContentProposal";

import AthleteSignup from "./AthleteSignup";

import AthleteProfile from "./AthleteProfile";

import CompanySignup from "./CompanySignup";

import Admin from "./Admin";

import Messages from "./Messages";

import PartnershipDashboard from "./PartnershipDashboard";

import MakeAdmin from "./MakeAdmin";

import CompanyDashboard from "./CompanyDashboard";

import AthleteDashboard from "./AthleteDashboard";

import StripeCheckout from "./StripeCheckout";

import BookCampaign from "./BookCampaign";

import Pricing from "./Pricing";

import BlogPost from "./BlogPost";

import Blog from "./Blog";

import AthleticDepartmentPortal from "./AthleticDepartmentPortal";

import PartnershipApplication from "./PartnershipApplication";

import PartnershipApplicationSuccess from "./PartnershipApplicationSuccess";

import ModelListEnrollment from "./ModelListEnrollment";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Home: Home,
    
    Athletes: Athletes,
    
    Companies: Companies,
    
    Partners: Partners,
    
    Opportunities: Opportunities,
    
    About: About,
    
    ContentProposal: ContentProposal,
    
    AthleteSignup: AthleteSignup,
    
    AthleteProfile: AthleteProfile,
    
    CompanySignup: CompanySignup,
    
    Admin: Admin,
    
    Messages: Messages,
    
    PartnershipDashboard: PartnershipDashboard,
    
    MakeAdmin: MakeAdmin,
    
    CompanyDashboard: CompanyDashboard,
    
    AthleteDashboard: AthleteDashboard,
    
    StripeCheckout: StripeCheckout,
    
    BookCampaign: BookCampaign,
    
    Pricing: Pricing,
    
    BlogPost: BlogPost,
    
    Blog: Blog,
    
    AthleticDepartmentPortal: AthleticDepartmentPortal,
    
    PartnershipApplication: PartnershipApplication,
    
    PartnershipApplicationSuccess: PartnershipApplicationSuccess,
    
    ModelListEnrollment: ModelListEnrollment,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/Athletes" element={<Athletes />} />
                
                <Route path="/Companies" element={<Companies />} />
                
                <Route path="/Partners" element={<Partners />} />
                
                <Route path="/Opportunities" element={<Opportunities />} />
                
                <Route path="/About" element={<About />} />
                
                <Route path="/ContentProposal" element={<ContentProposal />} />
                
                <Route path="/AthleteSignup" element={<AthleteSignup />} />
                
                <Route path="/AthleteProfile" element={<AthleteProfile />} />
                
                <Route path="/CompanySignup" element={<CompanySignup />} />
                
                <Route path="/Admin" element={<Admin />} />
                
                <Route path="/Messages" element={<Messages />} />
                
                <Route path="/PartnershipDashboard" element={<PartnershipDashboard />} />
                
                <Route path="/MakeAdmin" element={<MakeAdmin />} />
                
                <Route path="/CompanyDashboard" element={<CompanyDashboard />} />
                
                <Route path="/AthleteDashboard" element={<AthleteDashboard />} />
                
                <Route path="/StripeCheckout" element={<StripeCheckout />} />
                
                <Route path="/BookCampaign" element={<BookCampaign />} />
                
                <Route path="/Pricing" element={<Pricing />} />
                
                <Route path="/BlogPost" element={<BlogPost />} />
                
                <Route path="/Blog" element={<Blog />} />
                
                <Route path="/AthleticDepartmentPortal" element={<AthleticDepartmentPortal />} />
                
                <Route path="/PartnershipApplication" element={<PartnershipApplication />} />
                
                <Route path="/PartnershipApplicationSuccess" element={<PartnershipApplicationSuccess />} />
                
                <Route path="/ModelListEnrollment" element={<ModelListEnrollment />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}