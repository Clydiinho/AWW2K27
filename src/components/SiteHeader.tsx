import { site } from "../content/site";
import "./SiteHeader.css";

export default function SiteHeader() {
  return (
    <header className="site-header">
      <span className="site-header-left">{site.headerLeft}</span>
      <span className="site-header-right">{site.headerRight}</span>
    </header>
  );
}
