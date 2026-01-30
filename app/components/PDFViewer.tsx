const PDFViewer = ({ src }: { src: string }) => (
  <embed
    src={src}
    type="application/pdf"
    width="100%"
    height="400px"
    className="rounded-md"
    aria-label="Document PDF cu ghidul de utilizare FRDS"
    title="Ghid de utilizare FRDS - Documentație completă PDF"
  />
);

export default PDFViewer;