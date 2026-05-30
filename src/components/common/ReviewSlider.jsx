import React, { useEffect, useState } from "react"
import ReactStars from "react-rating-stars-component"
// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react"

// Import Swiper styles
import "swiper/css"
import "swiper/css/free-mode"
import "swiper/css/pagination"
import "../../App.css"
// Icons
import { FaStar } from "react-icons/fa"
// Import required modules
import { Autoplay, FreeMode, Pagination } from "swiper/modules"

// Get apiFunction and the endpoint
import { apiConnector } from "../../services/apiconnector"
import { ratingsEndpoints } from "../../services/apis"

function ReviewSlider() {
  const [reviews, setReviews] = useState([])
  const truncateWords = 15

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await apiConnector(
          "GET",
          ratingsEndpoints.REVIEWS_DETAILS_API
        )
        if (data?.success) {
          setReviews(data?.data || [])
        }
      } catch (error) {
        setReviews([])
      }
    })()
  }, [])

  // console.log(reviews)

  if (!reviews.length) {
    return (
      <div className="my-10 w-full text-center text-sm text-richblack-300">
        No reviews yet.
      </div>
    )
  }

  return (
    <div className="w-full text-white">
      <div className="my-10 w-full max-w-maxContentTab lg:max-w-maxContent">
        <Swiper
          slidesPerView={1}
          spaceBetween={18}
          loop={true}
          freeMode={true}
          autoplay={{
            delay: 2500,
            disableOnInteraction: false,
          }}
          breakpoints={{
            640: {
              slidesPerView: 2,
              spaceBetween: 18,
            },
            1024: {
              slidesPerView: 3,
              spaceBetween: 22,
            },
            1280: {
              slidesPerView: 4,
              spaceBetween: 24,
            },
          }}
          modules={[FreeMode, Pagination, Autoplay]}
          className="w-full pb-2"
        >
          {reviews.map((review, i) => {
            const reviewerName =
              `${review?.user?.firstName || ""} ${
                review?.user?.lastName || ""
              }`.trim() || "Learner"
            const reviewText = review?.review || ""
            const rating = Number(review?.rating) || 0

            return (
              <SwiperSlide key={i}>
                <div className="flex min-h-[210px] flex-col justify-between gap-4 rounded-md border border-richblack-700 bg-richblack-800 p-4 text-sm text-richblack-25 shadow-[0_12px_24px_rgba(0,0,0,0.18)]">
                  <div className="flex items-start gap-3">
                    <img
                      src={
                        review?.user?.image
                          ? review?.user?.image
                          : `https://api.dicebear.com/5.x/initials/svg?seed=${reviewerName}`
                      }
                      alt={reviewerName}
                      className="h-11 w-11 flex-shrink-0 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <h1 className="truncate font-semibold leading-5 text-richblack-5">
                        {reviewerName}
                      </h1>
                      <h2 className="review-line-clamp-2 mt-0.5 text-xs font-medium leading-4 text-richblack-400">
                        {review?.course?.courseName || "Course learner"}
                      </h2>
                    </div>
                  </div>
                  <p className="review-line-clamp-4 flex-1 font-medium leading-6 text-richblack-100">
                    {reviewText.split(" ").length > truncateWords
                      ? `${reviewText
                          .split(" ")
                          .slice(0, truncateWords)
                          .join(" ")} ...`
                      : reviewText}
                  </p>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-yellow-100">
                      {rating.toFixed(1)}
                    </h3>
                    <ReactStars
                      count={5}
                      value={rating}
                      size={18}
                      edit={false}
                      activeColor="#ffd700"
                      emptyIcon={<FaStar />}
                      fullIcon={<FaStar />}
                    />
                  </div>
                </div>
              </SwiperSlide>
            )
          })}
          {/* <SwiperSlide>Slide 1</SwiperSlide> */}
        </Swiper>
      </div>
    </div>
  )
}

export default ReviewSlider
