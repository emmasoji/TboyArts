export default function ArtworkTableHeader() {
  return (
    <thead>
      <tr className="text-left">
        <th
          className="
            sticky top-0 z-20
            border-b border-white/10
            bg-[#111113]
            px-5 py-4
            text-xs font-medium uppercase
            tracking-wider text-white/35
          "
        >
          Image
        </th>

        <th
          className="
            sticky top-0 z-20
            border-b border-white/10
            bg-[#111113]
            px-5 py-4
            text-xs font-medium uppercase
            tracking-wider text-white/35
          "
        >
          Title
        </th>

        <th
          className="
            sticky top-0 z-20
            border-b border-white/10
            bg-[#111113]
            px-5 py-4
            text-xs font-medium uppercase
            tracking-wider text-white/35
          "
        >
          Price
        </th>

        <th
          className="
            sticky top-0 z-20
            border-b border-white/10
            bg-[#111113]
            px-5 py-4
            text-xs font-medium uppercase
            tracking-wider text-white/35
          "
        >
          Category
        </th>

        <th
          className="
            sticky top-0 z-20
            border-b border-white/10
            bg-[#111113]
            px-5 py-4
            text-xs font-medium uppercase
            tracking-wider text-white/35
          "
        >
          Featured
        </th>

        <th
          className="
            sticky right-0 top-0 z-40
            w-16
            border-b border-l border-white/10
            bg-[#111113]
            px-5 py-4
          "
        />
      </tr>
    </thead>
  );
}