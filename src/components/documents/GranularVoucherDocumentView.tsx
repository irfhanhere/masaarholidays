import Image from "next/image";

export interface HotelVoucherData {
  bookingReference: string;
  guestName: string;
  hotel: string;
  city: string;
  checkInDate: string;
  checkOutDate: string;
  roomType: string;
  noOfGuests: string;
  confirmationNo: string;
  hotelImageUrl?: string;
  specialRequests?: string;
  voucherNotes?: string;
}

export interface TransferVoucherData {
  bookingReference: string;
  guestName: string;
  vehicleType: string;
  route: string;
  pickupDateTime: string;
  dropOffLocation?: string;
  flightNo?: string;
  driverContact?: string;
  confirmationNo: string;
  vehicleImageUrl?: string;
  specialRequests?: string;
  voucherNotes?: string;
}

export function GranularVoucherDocumentView({
  type,
  data,
  companyPhone = "+971 55 227 6299",
  companyEmail = "care@masaarholidays.com",
  companyWebsite = "www.masaarholidays.com",
}: {
  type: "hotel" | "transfer";
  data: HotelVoucherData | TransferVoucherData;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
}) {
  const isHotel = type === "hotel";
  const hotelData = isHotel ? (data as HotelVoucherData) : null;
  const transferData = !isHotel ? (data as TransferVoucherData) : null;

  return (
    <div
      className="mx-auto max-w-[800px] bg-white text-masaar-black shadow-sm print:shadow-none"
      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      {/* ── TOP HEADER BANNER ── */}
      <div className="relative overflow-hidden border-b border-black/10 bg-gradient-to-r from-[#FAF8F5] via-[#F4EFE6] to-[#FAF8F5] px-8 py-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/logo.png"
              alt="Masaar Holidays"
              width={160}
              height={48}
              className="h-10 w-auto object-contain"
              unoptimized
            />
          </div>

          <div className="border-l border-pure-gold/30 pl-4 text-left text-[9px] font-semibold tracking-[0.25em] text-pure-gold">
            <p>FAITH</p>
            <p>CLARITY</p>
            <p>CARE</p>
            <p>PEACE</p>
          </div>

          <div className="text-right">
            <p className="text-[10px] font-medium tracking-[0.2em] text-masaar-black/70 uppercase">
              A Journey of Faith
            </p>
            <p className="text-[9px] tracking-[0.18em] text-pure-gold uppercase">
              A Legacy of Service
            </p>
          </div>
        </div>
      </div>

      <div className="p-8">
        {/* ── VOUCHER TITLE & SUBTITLE ── */}
        <div className="mb-6 border-b border-black/10 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-masaar-black uppercase">
            {isHotel ? "Hotel Voucher" : "Transfer Voucher"}
          </h1>
          <p className="mt-1 text-xs text-masaar-black/70">
            {isHotel
              ? "Please present this voucher at the hotel reception upon check-in."
              : "Please present this voucher to your private chauffeur or airport representative."}
          </p>
        </div>

        {/* ── MAIN CONTENT (TABLE & IMAGE) ── */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Key-Value details */}
          <div className="md:col-span-8">
            <div className="overflow-hidden rounded-xl border border-black/10 bg-[#FAF9F6]">
              <table className="w-full text-left text-xs">
                <tbody className="divide-y divide-black/5">
                  <tr>
                    <td className="w-40 px-4 py-2.5 font-medium text-masaar-black/60">Booking Reference</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-masaar-black">: {data.bookingReference}</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2.5 font-medium text-masaar-black/60">Guest Name</td>
                    <td className="px-4 py-2.5 font-semibold text-masaar-black">: {data.guestName}</td>
                  </tr>

                  {isHotel && hotelData && (
                    <>
                      <tr>
                        <td className="px-4 py-2.5 font-medium text-masaar-black/60">Hotel</td>
                        <td className="px-4 py-2.5 font-bold text-masaar-black">: {hotelData.hotel}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-medium text-masaar-black/60">City</td>
                        <td className="px-4 py-2.5 text-masaar-black">: {hotelData.city}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-medium text-masaar-black/60">Check-in Date</td>
                        <td className="px-4 py-2.5 text-masaar-black">: {hotelData.checkInDate}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-medium text-masaar-black/60">Check-out Date</td>
                        <td className="px-4 py-2.5 text-masaar-black">: {hotelData.checkOutDate}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-medium text-masaar-black/60">Room Type</td>
                        <td className="px-4 py-2.5 text-masaar-black">: {hotelData.roomType}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-medium text-masaar-black/60">No. of Guests</td>
                        <td className="px-4 py-2.5 text-masaar-black">: {hotelData.noOfGuests}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-medium text-masaar-black/60">Confirmation No.</td>
                        <td className="px-4 py-2.5 font-mono font-bold text-deep-gold">: {hotelData.confirmationNo}</td>
                      </tr>
                    </>
                  )}

                  {!isHotel && transferData && (
                    <>
                      <tr>
                        <td className="px-4 py-2.5 font-medium text-masaar-black/60">Vehicle Type</td>
                        <td className="px-4 py-2.5 font-bold text-masaar-black">: {transferData.vehicleType}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-medium text-masaar-black/60">Route</td>
                        <td className="px-4 py-2.5 text-masaar-black">: {transferData.route}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-medium text-masaar-black/60">Pickup Date &amp; Time</td>
                        <td className="px-4 py-2.5 text-masaar-black">: {transferData.pickupDateTime}</td>
                      </tr>
                      {transferData.dropOffLocation && (
                        <tr>
                          <td className="px-4 py-2.5 font-medium text-masaar-black/60">Drop-off Location</td>
                          <td className="px-4 py-2.5 text-masaar-black">: {transferData.dropOffLocation}</td>
                        </tr>
                      )}
                      {transferData.flightNo && (
                        <tr>
                          <td className="px-4 py-2.5 font-medium text-masaar-black/60">Flight Number</td>
                          <td className="px-4 py-2.5 font-mono text-masaar-black">: {transferData.flightNo}</td>
                        </tr>
                      )}
                      {transferData.driverContact && (
                        <tr>
                          <td className="px-4 py-2.5 font-medium text-masaar-black/60">Driver / Fleet Contact</td>
                          <td className="px-4 py-2.5 text-masaar-black">: {transferData.driverContact}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="px-4 py-2.5 font-medium text-masaar-black/60">Confirmation No.</td>
                        <td className="px-4 py-2.5 font-mono font-bold text-deep-gold">: {transferData.confirmationNo}</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right photo card (Hotel or Vehicle) */}
          <div className="md:col-span-4 flex flex-col justify-start">
            <div className="overflow-hidden rounded-xl border border-black/10 bg-[#FAF9F6] p-2.5 text-center">
              <div className="relative aspect-4/3 w-full overflow-hidden rounded-lg bg-black/5">
                <Image
                  src={
                    isHotel
                      ? hotelData?.hotelImageUrl || "/hotels/swissotel-makkah/swissotel-makkah.webp"
                      : transferData?.vehicleImageUrl || "/vehicles/gmc-yukon-suburban.jpg"
                  }
                  alt={isHotel ? hotelData?.hotel || "Hotel" : transferData?.vehicleType || "Vehicle"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="mt-2.5">
                <p className="text-xs font-bold text-masaar-black">
                  {isHotel ? hotelData?.hotel : transferData?.vehicleType}
                </p>
                <p className="text-[10px] text-masaar-black/60">
                  {isHotel ? `${hotelData?.city}, Saudi Arabia` : "Masaar Luxury Fleet"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── SPECIAL REQUESTS CALLOUT ── */}
        {data.specialRequests && (
          <div className="mt-5 rounded-xl border border-pure-gold/30 bg-[#FAF6EE] p-4 text-xs">
            <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-deep-gold mb-1">
              <span>★</span>
              <span>Special Requests</span>
            </div>
            <p className="text-masaar-black/80">{data.specialRequests}</p>
          </div>
        )}

        {/* ── VOUCHER NOTES ── */}
        {data.voucherNotes && (
          <div className="mt-4 rounded-xl border border-black/10 bg-[#FAF9F6] p-4 text-xs">
            <p className="text-masaar-black/70 italic leading-relaxed">{data.voucherNotes}</p>
          </div>
        )}

        {/* ── BRAND FOOTER BAR ── */}
        <div className="mt-8 border-t border-black/10 pt-5">
          <div className="flex flex-wrap items-center justify-between gap-4 text-[11px] text-masaar-black/70">
            <div>
              <p className="font-bold text-masaar-black">Masaar Holidays</p>
              <p className="text-[10px] text-masaar-black/60">A Journey of Faith. A Legacy of Service.</p>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <p className="flex items-center gap-1.5">
                <span className="text-pure-gold">☎</span> {companyPhone}
              </p>
              <p className="flex items-center gap-1.5">
                <span className="text-pure-gold">✉</span> {companyEmail}
              </p>
              <p className="flex items-center gap-1.5">
                <span className="text-pure-gold">🌐</span> {companyWebsite}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
