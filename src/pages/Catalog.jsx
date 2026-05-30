import React, { useEffect, useState } from 'react'
import Footer from '../components/common/Footer'
import { useParams } from 'react-router-dom'
import { apiConnector } from '../services/apiconnector';
import { categories } from '../services/apis';
import { getCatalogaPageData } from '../services/operations/pageAndComponentData';
import { getAllCourses } from '../services/operations/courseDetailsAPI';
import CourseCard from '../components/core/Catalog/Course_Card';
import CourseSlider from '../components/core/Catalog/CourseSlider';
import { useSelector } from "react-redux"
import Error from "./Error"
import { slugify } from '../utils/slugify';

const Catalog = () => {

    const { loading } = useSelector((state) => state.profile)
  const { catalogName } = useParams()
  const [active, setActive] = useState(1)
    const [catalogPageData, setCatalogPageData] = useState(null);
    const [categoryId, setCategoryId] = useState("");

    const formatCatalogName = (slug) =>
        slug
            ?.split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ") || "Catalog";

    const addOtherDomainFallback = async (pageData, currentCatalogName) => {
        const differentCourses = pageData?.data?.differentCategory?.courses;

        if (differentCourses?.length) {
            return pageData;
        }

        const courses = await getAllCourses({ showToast: false });
        const otherDomainCourses = courses.filter(
            (course) => slugify(course?.category?.name) !== currentCatalogName
        );

        return {
            ...pageData,
            data: {
                ...pageData.data,
                differentCategory: {
                    ...(pageData?.data?.differentCategory || {}),
                    name: "Other Domains",
                    courses: otherDomainCourses,
                },
            },
        };
    };

    //Fetch all categories
    useEffect(()=> {
        const getCategories = async() => {
            try {
                if (!catalogName) {
                    const courses = await getAllCourses({ showToast: false });
                    setCatalogPageData({
                        success: true,
                        data: {
                            selectedCategory: {
                                name: "All Courses",
                                description: "Explore all published courses available on the platform.",
                                courses,
                            },
                            mostSellingCourses: courses,
                        },
                    });
                    return;
                }

                const res = await apiConnector("GET", categories.CATEGORIES_API);
                const category = res?.data?.data?.find(
                    (ct) => slugify(ct.name) === catalogName
                );

                if (!category) {
                    const courses = await getAllCourses({ showToast: false });
                    const filteredCourses = courses.filter(
                        (course) => slugify(course?.category?.name) === catalogName
                    );
                    const otherDomainCourses = courses.filter(
                        (course) => slugify(course?.category?.name) !== catalogName
                    );

                    setCatalogPageData({
                        success: true,
                        data: {
                            selectedCategory: {
                                name: formatCatalogName(catalogName),
                                description: `Explore ${formatCatalogName(catalogName)} courses available on the platform.`,
                                courses: filteredCourses,
                            },
                            differentCategory: {
                                name: "Other Domains",
                                courses: otherDomainCourses,
                            },
                            mostSellingCourses: filteredCourses,
                        },
                    });
                    return;
                }

                setCategoryId(category._id);
            } catch (error) {
                console.log(error);
                setCatalogPageData(error.response?.data || {
                    success: false,
                    message: "Could not fetch categories",
                });
            }
        }
        getCategories();
    },[catalogName]);

    useEffect(() => {
        const getCategoryDetails = async() => {
            try{
                const res = await getCatalogaPageData(categoryId, { showToast: false });
                console.log("PRinting res: ", res);
                const dataWithOtherDomains = await addOtherDomainFallback(res, catalogName);
                setCatalogPageData(dataWithOtherDomains);
            }
            catch(error) {
                console.log(error)
            }
        }
        if(catalogName && categoryId) {
            getCategoryDetails();
        }
        
    },[catalogName, categoryId]);


    if (loading || !catalogPageData) {
        return (
          <div className="grid min-h-[calc(100vh-3.5rem)] place-items-center">
            <div className="spinner"></div>
          </div>
        )
      }
      if (!loading && !catalogPageData.success) {
        return <Error />
      }

      if (!catalogName) {
        return (
          <>
            <div className="box-content bg-richblack-800 px-4">
              <div className="mx-auto flex min-h-[260px] max-w-maxContentTab flex-col justify-center gap-4 lg:max-w-maxContent">
                <p className="text-sm text-richblack-300">
                  Home / <span className="text-yellow-25">Catalog</span>
                </p>
                <p className="text-3xl text-richblack-5">
                  {catalogPageData?.data?.selectedCategory?.name}
                </p>
                <p className="max-w-[870px] text-richblack-200">
                  {catalogPageData?.data?.selectedCategory?.description}
                </p>
              </div>
            </div>

            <div className="mx-auto box-content w-full max-w-maxContentTab px-4 py-12 lg:max-w-maxContent">
              <div className="section_heading">All published courses</div>
              <div className="my-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {catalogPageData?.data?.selectedCategory?.courses?.length ? (
                  catalogPageData.data.selectedCategory.courses.map((course) => (
                    <CourseCard
                      course={course}
                      key={course._id}
                      Height={"h-[250px]"}
                    />
                  ))
                ) : (
                  <p className="col-span-full rounded-md border border-yellow-100/30 bg-richblack-800 px-6 py-5 text-3xl font-semibold text-yellow-50 shadow-[0_0_24px_rgba(255,214,10,0.08)]">
                    No Course Found
                  </p>
                )}
              </div>
            </div>

            <Footer />
          </>
        )
      }
    
      return (
        <>
          {/* Hero Section */}
          <div className=" box-content bg-richblack-800 px-4">
            <div className="mx-auto flex min-h-[260px] max-w-maxContentTab flex-col justify-center gap-4 lg:max-w-maxContent ">
              <p className="text-sm text-richblack-300">
                {`Home / Catalog / `}
                <span className="text-yellow-25">
                  {catalogPageData?.data?.selectedCategory?.name}
                </span>
              </p>
              <p className="text-3xl text-richblack-5">
                {catalogPageData?.data?.selectedCategory?.name}
              </p>
              <p className="max-w-[870px] text-richblack-200">
                {catalogPageData?.data?.selectedCategory?.description}
              </p>
            </div>
          </div>
    
          {/* Section 1 */}
          <div className=" mx-auto box-content w-full max-w-maxContentTab px-4 py-12 lg:max-w-maxContent">
            <div className="section_heading">Courses to get you started</div>
            <div className="my-4 flex border-b border-b-richblack-600 text-sm">
              <p
                className={`px-4 py-2 ${
                  active === 1
                    ? "border-b border-b-yellow-25 text-yellow-25"
                    : "text-richblack-50"
                } cursor-pointer`}
                onClick={() => setActive(1)}
              >
                Most Populer
              </p>
              <p
                className={`px-4 py-2 ${
                  active === 2
                    ? "border-b border-b-yellow-25 text-yellow-25"
                    : "text-richblack-50"
                } cursor-pointer`}
                onClick={() => setActive(2)}
              >
                New
              </p>
            </div>
            <div>
              <CourseSlider
                Courses={catalogPageData?.data?.selectedCategory?.courses}
              />
            </div>
          </div>
          {/* Section 2 */}
          <div className=" mx-auto box-content w-full max-w-maxContentTab px-4 py-12 lg:max-w-maxContent">
            <div className="section_heading">
              Top courses in other domains
            </div>
            <div className="py-8">
              <CourseSlider
                Courses={catalogPageData?.data?.differentCategory?.courses}
              />
            </div>
          </div>
    
          {/* Section 3 */}
          <div className=" mx-auto box-content w-full max-w-maxContentTab px-4 py-12 lg:max-w-maxContent">
            <div className="section_heading">Frequently Bought</div>
            <div className="py-8">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {catalogPageData?.data?.mostSellingCourses
                  ?.slice(0, 4)
                  .map((course, i) => (
                    <CourseCard course={course} key={i} Height={"h-[400px]"} />
                  ))}
              </div>
            </div>
          </div>
    
          <Footer />
        </>
      )
    }
    
    export default Catalog
