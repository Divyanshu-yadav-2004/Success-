import React from "react";
import { User } from "lucide-react";

interface ChatMessageContentProps {
  content: string;
  role: "user" | "assistant";
}

interface ProfileField {
  label: string;
  value: string;
}

/**
 * Checks if the message content represents a profile information response
 */
function parseProfileCard(content: string): {
  isProfile: boolean;
  preamble?: string;
  title: string;
  fields: ProfileField[];
  footerText?: string;
} | null {
  const normalized = content.replace(/\r\n/g, "\n");

  const hasProfileKeyword =
    /your profile information|profile details|user profile|account details|प्रोफ़ाइल/i.test(
      normalized
    );

  const hasProfileFields =
    /full\s*name|email|phone|address|mobile/i.test(normalized);

  if (!hasProfileKeyword && !hasProfileFields) {
    return null;
  }

  const lines = normalized.split("\n").map((l) => l.trim()).filter(Boolean);
  const fields: ProfileField[] = [];
  const preambleLines: string[] = [];
  const footerLines: string[] = [];

  let foundFields = false;
  let title = "Your Profile Information";

  for (const line of lines) {
    const cleanLine = line.replace(/^\s*[-*•]\s*/, "").trim();

    // Check if line is title
    if (
      /your profile information|profile details|user profile/i.test(cleanLine) &&
      !cleanLine.includes(":")
    ) {
      title =
        cleanLine.replace(/[*_#👤:]/g, "").trim() || "Your Profile Information";
      continue;
    }

    // Match "Label: Value" or "**Label**: Value" or "- **Label**: Value"
    const match = cleanLine.match(
      /^\*{0,2}(Full Name|Name|Email Address|Email|Phone Number|Phone|Mobile|Address|Role|Status|User ID)\*{0,2}\s*:\s*(.+)$/i
    );

    if (match) {
      foundFields = true;
      const rawLabel = match[1].replace(/[*_]/g, "").trim();
      const rawVal = match[2].replace(/[*_]/g, "").trim();

      let label = rawLabel;
      if (/full\s*name|name/i.test(rawLabel)) label = "Full Name";
      else if (/email/i.test(rawLabel)) label = "Email";
      else if (/phone|mobile/i.test(rawLabel)) label = "Phone";
      else if (/address/i.test(rawLabel)) label = "Address";
      else if (/role/i.test(rawLabel)) label = "Role";

      fields.push({
        label,
        value: rawVal || "N/A",
      });
    } else if (foundFields) {
      footerLines.push(cleanLine);
    } else if (!/your profile information|profile details/i.test(cleanLine)) {
      preambleLines.push(cleanLine);
    }
  }

  if (fields.length >= 2) {
    return {
      isProfile: true,
      preamble: preambleLines.join("\n").trim(),
      title,
      fields,
      footerText: footerLines.join("\n").trim(),
    };
  }

  return null;
}

/**
 * Clean inline markdown parser for bold, italics, code, and links
 */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|_[^_]+_|`[^`]+`)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={match.index} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (
      (token.startsWith("*") && token.endsWith("*")) ||
      (token.startsWith("_") && token.endsWith("_"))
    ) {
      parts.push(
        <em key={match.index} className="italic text-slate-800">
          {token.slice(1, -1)}
        </em>
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={match.index}
          className="bg-slate-100 text-indigo-700 px-1 py-0.5 rounded text-[11px] font-mono border border-slate-200"
        >
          {token.slice(1, -1)}
        </code>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

/**
 * Clean native message block renderer (bullets, paragraphs, clean line spacing)
 */
function renderFormattedMessage(content: string) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];

  let currentList: React.ReactNode[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      blocks.push(
        <ul key={`list-${blocks.length}`} className="space-y-1 my-1.5 pl-3 list-none">
          {currentList}
        </ul>
      );
      currentList = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      blocks.push(<div key={`empty-${idx}`} className="h-1.5" />);
      return;
    }

    // Bullet point
    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch) {
      currentList.push(
        <li key={`item-${idx}`} className="flex items-start gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
          <span className="flex-1">{renderInlineMarkdown(bulletMatch[1])}</span>
        </li>
      );
      return;
    }

    // Numbered list item
    const numberMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numberMatch) {
      currentList.push(
        <li key={`num-${idx}`} className="flex items-start gap-2">
          <span className="font-semibold text-slate-900 shrink-0">
            {numberMatch[1]}.
          </span>
          <span className="flex-1">{renderInlineMarkdown(numberMatch[2])}</span>
        </li>
      );
      return;
    }

    flushList();

    // Regular line / paragraph
    blocks.push(
      <p key={`p-${idx}`} className="leading-relaxed">
        {renderInlineMarkdown(trimmed)}
      </p>
    );
  });

  flushList();
  return <div className="space-y-1">{blocks}</div>;
}

/**
 * Clean, seamless Profile Information message formatted natively inside the chat bubble
 */
const ProfileInformationMessage: React.FC<{
  title: string;
  fields: ProfileField[];
  preamble?: string;
  footerText?: string;
}> = ({ title, fields, preamble, footerText }) => {
  return (
    <div className="space-y-3 leading-relaxed">
      {preamble && (
        <div className="text-slate-800">
          {renderFormattedMessage(preamble)}
        </div>
      )}

      {/* Heading with aligned user icon */}
      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm tracking-tight">
        <User className="w-4 h-4 text-indigo-600 shrink-0" />
        <span>{title}</span>
      </div>

      {/* Stacked label / value fields with clean spacing */}
      <div className="space-y-2.5">
        {fields.map((field, idx) => (
          <div key={idx} className="flex flex-col">
            <span className="font-semibold text-slate-900 text-xs">
              {field.label}
            </span>
            <span className="text-slate-700 text-xs sm:text-sm break-all sm:break-words">
              {field.value}
            </span>
          </div>
        ))}
      </div>

      {footerText && (
        <div className="text-slate-600 text-xs sm:text-sm mt-2">
          {renderFormattedMessage(footerText)}
        </div>
      )}
    </div>
  );
};

export const ChatMessageContent: React.FC<ChatMessageContentProps> = ({
  content,
  role,
}) => {
  if (role === "user") {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  // Check if assistant response contains profile information
  const profileData = parseProfileCard(content);
  if (profileData && profileData.isProfile) {
    return (
      <ProfileInformationMessage
        title={profileData.title}
        fields={profileData.fields}
        preamble={profileData.preamble}
        footerText={profileData.footerText}
      />
    );
  }

  // Standard clean assistant message
  return renderFormattedMessage(content);
};

export default ChatMessageContent;
