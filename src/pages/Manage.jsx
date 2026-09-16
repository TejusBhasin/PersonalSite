import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RecordManager from "@/components/manage/RecordManager";
import TextEditor from "@/components/manage/TextEditor";

const MONT = { fontFamily: "'Montserrat', system-ui, sans-serif" };

const PROJECT_FIELDS = [
  { key: "name", label: "Name", type: "text" },
  { key: "url", label: "Live URL", type: "text" },
  { key: "tagline", label: "Tagline", type: "text" },
  { key: "skills", label: "Skills (comma separated)", type: "list" },
  { key: "summary", label: "What it does", type: "textarea" },
  { key: "why", label: "Why I built it", type: "textarea" },
  { key: "description", label: "How it works", type: "textarea" },
  { key: "sort_order", label: "Order", type: "number" },
  { key: "visible", label: "Visible", type: "boolean" },
];

const PLACARD_FIELDS = [
  { key: "title", label: "Title", type: "text" },
  { key: "subtitle", label: "Subtitle (large placards)", type: "text" },
  { key: "description", label: "Description (small placards)", type: "text" },
  { key: "size", label: "Size (large = full-width banner, small = grid card)", type: "select", options: ["small", "large"] },
  { key: "icon", label: "Icon", type: "select", options: ["award", "book", "camera", "medal", "school", "star", "trophy", "users"] },
  { key: "sort_order", label: "Order", type: "number" },
  { key: "visible", label: "Visible", type: "boolean" },
];

const AWARD_FIELDS = [
  { key: "title", label: "Title", type: "text" },
  { key: "issuer", label: "Issued by", type: "text" },
  { key: "issued_date", label: "Date (e.g. Mar 2026)", type: "text" },
  { key: "association", label: "Associated with", type: "text" },
  { key: "description", label: "Description", type: "textarea" },
  { key: "sort_order", label: "Order", type: "number" },
  { key: "visible", label: "Visible", type: "boolean" },
];

export default function Manage() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  if (user === undefined) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-2xl font-bold mb-4" style={MONT}>Admin access required</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Log in with an admin account to manage the site's content.
        </p>
        <Link
          to="/login"
          className="text-xs font-bold tracking-widest uppercase text-foreground/60 hover:text-foreground transition-colors"
          style={MONT}
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-2" style={MONT}>Manage Content</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Edit any text, add projects, placards, and debate awards — changes appear on the site immediately.
      </p>

      <Tabs defaultValue="text">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="text">Text</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="placards">Placards</TabsTrigger>
          <TabsTrigger value="awards">Debate Awards</TabsTrigger>
        </TabsList>
        <TabsContent value="text" className="mt-6">
          <TextEditor />
        </TabsContent>
        <TabsContent value="projects" className="mt-6">
          <RecordManager
            entityName="Project"
            fields={PROJECT_FIELDS}
            defaults={{ visible: true, sort_order: 99 }}
            addLabel="Add Project"
          />
        </TabsContent>
        <TabsContent value="placards" className="mt-6">
          <RecordManager
            entityName="Placard"
            fields={PLACARD_FIELDS}
            defaults={{ size: "small", icon: "award", visible: true, sort_order: 99 }}
            addLabel="Add Placard"
          />
        </TabsContent>
        <TabsContent value="awards" className="mt-6">
          <RecordManager
            entityName="Award"
            fields={AWARD_FIELDS}
            defaults={{ issuer: "NYCUDL", association: "Horace Mann School", visible: true, sort_order: 99 }}
            addLabel="Add Award"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}