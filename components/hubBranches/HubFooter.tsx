interface Props {
  description?: string;
}

export default function HubFooter({ description }: Props) {
  return (
    <div className="px-2 sm:px-0">

      {description && (
        <div
          className="prose dark:prose-invert max-w-none mb-10"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      )}

    </div>
  );
}