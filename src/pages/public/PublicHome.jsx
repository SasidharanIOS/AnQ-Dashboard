import React from "react";
import { Link } from "react-router-dom";
import Logo from "../../components/common/Logo.jsx";

export default function PublicHome(){return <div className="public-home"><header><Logo/><Link to="/login">Login</Link></header><section><h1>Compare Quotes from Trusted UK Moving Companies</h1><p>Get competitive quotes from verified removal companies. Compare prices, chat securely and book with confidence.</p><Link to="/login">Get Free Quotes</Link></section></div>}
