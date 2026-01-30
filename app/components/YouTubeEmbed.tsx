const YouTubeEmbed = ({ videoId }: { videoId: string }) => (
  <iframe
    className="w-full h-72 md:h-96 rounded-lg"
    src={`https://www.youtube.com/embed/${videoId}`}
    title="Tutorial video FRDS - Ghid complet de utilizare a platformei"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
    loading="lazy"
    aria-label="Video tutorial pentru utilizarea platformei FRDS"
  />
);

export default YouTubeEmbed;