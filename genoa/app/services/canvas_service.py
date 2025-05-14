from typing import Dict, List, Optional, Any
import httpx
import datetime
from fastapi import HTTPException
from statistics import mean, median, stdev

class CanvasService:
    def __init__(self, base_url: str, access_token: str):
        """
        Initialize the Canvas service with the base URL and access token.

        Args:
            base_url: The base URL of the Canvas LMS API
            access_token: The user's access token for Canvas LMS API
        """
        # Fix URL encoding issues
        if "\\x3a//" in base_url:
            base_url = base_url.replace("\\x3a//", "://")

        # Ensure the base URL has the correct format
        if not base_url.startswith("http://") and not base_url.startswith("https://"):
            base_url = "https://" + base_url

        # Remove trailing slash if present
        if base_url.endswith("/"):
            base_url = base_url[:-1]

        self.base_url = base_url
        self.headers = {"Authorization": f"Bearer {access_token}"}
        print(f"Initialized Canvas service with base URL: {self.base_url}")

    async def get_user_info(self) -> Dict[str, Any]:
        """Get information about the current user."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/v1/users/self",
                headers=self.headers
            )

            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch user information")

            return response.json()

    async def get_courses(self) -> List[Dict[str, Any]]:
        """Get all available courses for the user."""
        try:
            print(f"Fetching courses from {self.base_url}/api/v1/courses")
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/api/v1/courses",
                    headers=self.headers,
                    params={"enrollment_state": "active", "include": ["term", "total_students"]}
                )

                print(f"Response status: {response.status_code}")
                print(f"Response headers: {response.headers}")

                if response.status_code != 200:
                    error_text = response.text
                    print(f"Error response: {error_text}")
                    raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch courses: {error_text}")

                data = response.json()
                print(f"Got {len(data)} courses")
                return data
        except Exception as e:
            print(f"Exception in get_courses: {str(e)}")
            raise

    async def get_course(self, course_id: int) -> Dict[str, Any]:
        """Get detailed information for a specific course."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/v1/courses/{course_id}",
                headers=self.headers,
                params={"include": ["term", "syllabus_body", "total_students"]}
            )

            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch course details")

            return response.json()

    async def get_course_syllabus(self, course_id: int) -> str:
        """Get the syllabus for a specific course."""
        course = await self.get_course(course_id)
        return course.get("syllabus_body", "No syllabus available")

    async def get_course_professor(self, course_id: int) -> Dict[str, Any]:
        """Get professor information for a specific course."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/v1/courses/{course_id}/users",
                headers=self.headers,
                params={"enrollment_type": "teacher"}
            )

            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch professor information")

            teachers = response.json()
            if not teachers:
                return {"message": "No professor found for this course"}

            return teachers[0]  # Return the first teacher

    async def get_assignments(self, course_id: int) -> List[Dict[str, Any]]:
        """Get all assignments for a specific course."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/v1/courses/{course_id}/assignments",
                headers=self.headers
            )

            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch assignments")

            return response.json()

    async def get_assignment(self, course_id: int, assignment_id: int) -> Dict[str, Any]:
        """Get detailed information for a specific assignment."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/v1/courses/{course_id}/assignments/{assignment_id}",
                headers=self.headers
            )

            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch assignment details")

            return response.json()

    async def get_upcoming_assignments(self, course_id: int, days: int = 7) -> List[Dict[str, Any]]:
        """Get upcoming assignments for a specific course within the specified number of days."""
        import datetime

        assignments = await self.get_assignments(course_id)
        now = datetime.datetime.now()
        cutoff_date = now + datetime.timedelta(days=days)

        upcoming = []
        for assignment in assignments:
            if "due_at" in assignment and assignment["due_at"]:
                due_date = datetime.datetime.fromisoformat(assignment["due_at"].replace("Z", "+00:00"))
                if now <= due_date <= cutoff_date:
                    upcoming.append(assignment)

        return upcoming

    async def get_two_stage_data(self) -> Dict[str, Any]:
        """Get current courses and their assignments in one call."""
        courses = await self.get_courses()
        result = {"courses": []}

        for course in courses:
            course_id = course["id"]
            assignments = await self.get_assignments(course_id)
            course_with_assignments = {**course, "assignments": assignments}
            result["courses"].append(course_with_assignments)

        return result

    async def get_submissions(self, course_id: int, assignment_id: int) -> List[Dict[str, Any]]:
        """Get all submissions for a specific assignment."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/v1/courses/{course_id}/assignments/{assignment_id}/submissions",
                headers=self.headers
            )

            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch submissions")

            return response.json()

    async def get_student_submission(self, course_id: int, assignment_id: int, user_id: str = "self") -> Dict[str, Any]:
        """Get a specific student's submission for an assignment."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/v1/courses/{course_id}/assignments/{assignment_id}/submissions/{user_id}",
                headers=self.headers
            )

            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch submission")

            return response.json()

    async def get_course_grades(self, course_id: int) -> Dict[str, Any]:
        """Get the current user's grades for a specific course."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/v1/courses/{course_id}",
                headers=self.headers,
                params={"include": ["total_scores", "current_grading_period_scores"]}
            )

            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch course grades")

            return response.json()

    async def get_assignment_groups(self, course_id: int) -> List[Dict[str, Any]]:
        """Get assignment groups for a specific course."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}/api/v1/courses/{course_id}/assignment_groups",
                headers=self.headers,
                params={"include": ["assignments"]}
            )

            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch assignment groups")

            return response.json()

    async def get_student_submissions_for_course(self, course_id: int, user_id: str = "self") -> List[Dict[str, Any]]:
        """Get all submissions for a student in a specific course."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/api/v1/courses/{course_id}/students/submissions",
                    headers=self.headers,
                    params={"student_ids": [user_id], "include": ["assignment"]}
                )

                if response.status_code != 200:
                    print(f"Error fetching student submissions: {response.status_code} - {response.text}")
                    if response.status_code == 401:
                        raise HTTPException(status_code=401, detail="Unauthorized. Please check your Canvas API key.")
                    elif response.status_code == 403:
                        raise HTTPException(status_code=403, detail="Forbidden. You don't have permission to access this resource.")
                    elif response.status_code == 404:
                        raise HTTPException(status_code=404, detail="Resource not found. The course or student may not exist.")
                    else:
                        raise HTTPException(status_code=response.status_code, detail=f"Failed to fetch student submissions: {response.text}")

                return response.json()
        except httpx.RequestError as e:
            print(f"Request error when fetching student submissions: {e}")
            raise HTTPException(status_code=500, detail=f"Network error when fetching student submissions: {str(e)}")
        except Exception as e:
            print(f"Unexpected error when fetching student submissions: {e}")
            raise HTTPException(status_code=500, detail=f"Error fetching student submissions: {str(e)}")

    async def analyze_course_performance(self, course_id: int) -> Dict[str, Any]:
        """Analyze student performance in a specific course."""
        try:
            # Get course details first (this should be more reliable)
            course = await self.get_course(course_id)
            course_name = course.get("name", "Unknown Course")

            # Initialize with basic course info
            result = {
                "course_id": course_id,
                "course_name": course_name,
                "current_grade": None,
                "total_assignments": 0,
                "graded_assignments": 0,
                "message": "Basic course information retrieved successfully"
            }

            # Try to get course grades (this should be relatively reliable)
            try:
                course_grades = await self.get_course_grades(course_id)
                if "enrollments" in course_grades:
                    for enrollment in course_grades["enrollments"]:
                        if "current_grade" in enrollment:
                            result["current_grade"] = enrollment["current_grade"]
                            break
                result["message"] += ". Grade information retrieved successfully"
            except Exception as e:
                print(f"Error getting course grades: {e}")
                result["message"] += f". Could not retrieve grade information: {str(e)}"

            # Try to get assignments (this should be relatively reliable)
            try:
                assignments = await self.get_assignments(course_id)
                result["total_assignments"] = len(assignments)
                result["assignments"] = assignments
                result["message"] += ". Assignment information retrieved successfully"
            except Exception as e:
                print(f"Error getting assignments: {e}")
                result["message"] += f". Could not retrieve assignment information: {str(e)}"

            # Try to get submissions (this might fail based on the error we're seeing)
            submissions = []
            try:
                submissions = await self.get_student_submissions_for_course(course_id)
                graded_submissions = [s for s in submissions if s.get("grade") and s.get("grade") != ""]
                result["graded_assignments"] = len(graded_submissions)
                result["message"] += ". Submission information retrieved successfully"

                # Only proceed with detailed analysis if we have submissions
                if graded_submissions:
                    # Convert string grades to numeric where possible
                    numeric_grades = []
                    for submission in graded_submissions:
                        try:
                            if submission.get("score") is not None:
                                numeric_grades.append(float(submission["score"]))
                        except (ValueError, TypeError):
                            pass

                    if numeric_grades:
                        result["average_score"] = mean(numeric_grades)
                        result["median_score"] = median(numeric_grades)
                        if len(numeric_grades) > 1:
                            result["score_std_dev"] = stdev(numeric_grades)

                    # Try to get assignment groups
                    try:
                        assignment_groups = await self.get_assignment_groups(course_id)

                        # Group submissions by assignment group
                        submissions_by_group = {}
                        for submission in graded_submissions:
                            assignment = submission.get("assignment", {})
                            group_id = assignment.get("assignment_group_id")
                            if group_id:
                                if group_id not in submissions_by_group:
                                    submissions_by_group[group_id] = []
                                submissions_by_group[group_id].append(submission)

                        # Calculate statistics by group
                        group_stats = {}
                        for group in assignment_groups:
                            group_id = group["id"]
                            if group_id in submissions_by_group:
                                group_submissions = submissions_by_group[group_id]
                                group_scores = []
                                for submission in group_submissions:
                                    try:
                                        if submission.get("score") is not None:
                                            group_scores.append(float(submission["score"]))
                                    except (ValueError, TypeError):
                                        pass

                                if group_scores:
                                    group_stats[group["name"]] = {
                                        "average_score": mean(group_scores) if group_scores else None,
                                        "submissions_count": len(group_submissions),
                                        "weight": group.get("group_weight", 0)
                                    }

                        result["group_statistics"] = group_stats

                        # Identify strengths and weaknesses
                        strengths = []
                        weaknesses = []

                        if numeric_grades:
                            avg_score = mean(numeric_grades)
                            for group_name, stats in group_stats.items():
                                if stats["average_score"] is not None:
                                    if stats["average_score"] > avg_score:
                                        strengths.append(group_name)
                                    else:
                                        weaknesses.append(group_name)

                        result["strengths"] = strengths
                        result["weaknesses"] = weaknesses
                        result["message"] += ". Detailed performance analysis completed"
                    except Exception as e:
                        print(f"Error analyzing assignment groups: {e}")
                        result["message"] += f". Could not complete detailed analysis: {str(e)}"
                else:
                    result["message"] += ". No graded assignments found for detailed analysis"
            except Exception as e:
                print(f"Error getting submissions: {e}")
                result["message"] += f". Could not retrieve submission information: {str(e)}"

                # If we can't get submissions, try to provide some basic analysis based on assignments
                if "assignments" in result:
                    upcoming_assignments = []
                    for assignment in result["assignments"]:
                        if assignment.get("due_at"):
                            due_date = datetime.datetime.fromisoformat(assignment["due_at"].replace("Z", "+00:00"))
                            if due_date > datetime.datetime.now():
                                upcoming_assignments.append(assignment)

                    result["upcoming_assignments_count"] = len(upcoming_assignments)
                    if upcoming_assignments:
                        result["message"] += f". Found {len(upcoming_assignments)} upcoming assignments"

            return result

        except Exception as e:
            print(f"Error in analyze_course_performance: {e}")
            return {
                "course_id": course_id,
                "message": f"Error analyzing course performance: {str(e)}",
                "error": True
            }

    async def analyze_assignment_performance(self, course_id: int, assignment_id: int) -> Dict[str, Any]:
        """Analyze student performance on a specific assignment."""
        # Get the assignment details
        assignment = await self.get_assignment(course_id, assignment_id)

        # Get the student's submission
        submission = await self.get_student_submission(course_id, assignment_id)

        # Get all submissions to calculate class statistics
        all_submissions = await self.get_submissions(course_id, assignment_id)

        # Calculate statistics
        scores = []
        for sub in all_submissions:
            try:
                if sub.get("score") is not None:
                    scores.append(float(sub["score"]))
            except (ValueError, TypeError):
                pass

        # Get student's score
        student_score = None
        try:
            if submission.get("score") is not None:
                student_score = float(submission["score"])
        except (ValueError, TypeError):
            pass

        # Calculate percentile if possible
        percentile = None
        if student_score is not None and scores:
            below_count = sum(1 for score in scores if score < student_score)
            percentile = (below_count / len(scores)) * 100

        return {
            "assignment_id": assignment_id,
            "assignment_name": assignment.get("name", "Unknown Assignment"),
            "points_possible": assignment.get("points_possible"),
            "student_score": student_score,
            "submission_date": submission.get("submitted_at"),
            "late": submission.get("late", False),
            "class_average": mean(scores) if scores else None,
            "class_median": median(scores) if scores else None,
            "class_std_dev": stdev(scores) if len(scores) > 1 else None,
            "percentile": percentile,
            "feedback": submission.get("comment", "")
        }

    async def generate_study_plan(self, course_id: int, days_ahead: int = 14) -> Dict[str, Any]:
        """Generate a personalized study plan based on past performance and upcoming assignments."""
        try:
            # Get course details first (this should be more reliable)
            course = await self.get_course(course_id)
            course_name = course.get("name", "Unknown Course")

            # Initialize with basic course info
            result = {
                "course_id": course_id,
                "course_name": course_name,
                "current_grade": None,
                "strengths": [],
                "weaknesses": [],
                "upcoming_assignments": [],
                "focus_areas": [],
                "recommendations": [],
                "message": "Basic course information retrieved successfully"
            }

            # Get course performance analysis
            try:
                performance = await self.analyze_course_performance(course_id)
                result["current_grade"] = performance.get("current_grade")
                result["strengths"] = performance.get("strengths", [])
                result["weaknesses"] = performance.get("weaknesses", [])
                result["message"] += ". Performance analysis completed"
            except Exception as e:
                print(f"Error analyzing course performance: {e}")
                result["message"] += f". Could not analyze performance: {str(e)}"

            # Get upcoming assignments
            try:
                upcoming = await self.get_upcoming_assignments(course_id, days_ahead)

                # Try to get assignment groups
                try:
                    assignment_groups = await self.get_assignment_groups(course_id)

                    # Create a mapping of assignment group IDs to names
                    group_names = {group["id"]: group["name"] for group in assignment_groups}

                    # Organize upcoming assignments by group
                    upcoming_by_group = {}
                    for assignment in upcoming:
                        group_id = assignment.get("assignment_group_id")
                        if group_id:
                            group_name = group_names.get(group_id, "Other")
                            if group_name not in upcoming_by_group:
                                upcoming_by_group[group_name] = []
                            upcoming_by_group[group_name].append(assignment)

                    # Prioritize assignments based on due date and weight
                    prioritized_assignments = []
                    for assignment in upcoming:
                        group_id = assignment.get("assignment_group_id")
                        group_name = group_names.get(group_id, "Other")

                        # Find the group weight
                        weight = 0
                        for group in assignment_groups:
                            if group["id"] == group_id:
                                weight = group.get("group_weight", 0)
                                break

                        # Calculate priority score (earlier due date and higher weight = higher priority)
                        due_date = None
                        if assignment.get("due_at"):
                            due_date = datetime.datetime.fromisoformat(assignment["due_at"].replace("Z", "+00:00"))
                            days_until_due = max(0, (due_date - datetime.datetime.now()).days)
                            # Priority formula: lower is higher priority
                            priority = days_until_due / (weight + 0.1)  # Add 0.1 to avoid division by zero
                        else:
                            priority = float('inf')  # No due date = lowest priority

                        prioritized_assignments.append({
                            "id": assignment["id"],
                            "name": assignment["name"],
                            "due_date": assignment.get("due_at"),
                            "points_possible": assignment.get("points_possible"),
                            "group": group_name,
                            "weight": weight,
                            "priority": priority
                        })

                    # Sort by priority (lower number = higher priority)
                    prioritized_assignments.sort(key=lambda x: x["priority"])
                    result["upcoming_assignments"] = prioritized_assignments

                    # Generate focus areas based on weaknesses
                    focus_areas = []
                    for weakness in result["weaknesses"]:
                        focus_areas.append({
                            "area": weakness,
                            "reason": f"Your performance in {weakness} assignments is below your course average."
                        })

                    # If there are upcoming assignments in weak areas, highlight them
                    for area in focus_areas:
                        area_name = area["area"]
                        if area_name in upcoming_by_group:
                            area["upcoming_assignments"] = len(upcoming_by_group[area_name])
                            area["priority"] = "High" if area["upcoming_assignments"] > 0 else "Medium"
                        else:
                            area["upcoming_assignments"] = 0
                            area["priority"] = "Medium"

                    result["focus_areas"] = focus_areas
                    result["message"] += ". Assignment prioritization completed"
                except Exception as e:
                    print(f"Error processing assignment groups: {e}")
                    result["message"] += f". Could not prioritize assignments: {str(e)}"

                    # Fallback: just sort assignments by due date
                    simple_assignments = []
                    for assignment in upcoming:
                        simple_assignments.append({
                            "id": assignment["id"],
                            "name": assignment["name"],
                            "due_date": assignment.get("due_at"),
                            "points_possible": assignment.get("points_possible")
                        })

                    # Sort by due date
                    simple_assignments.sort(key=lambda x: x.get("due_at", "9999-12-31"))
                    result["upcoming_assignments"] = simple_assignments
            except Exception as e:
                print(f"Error getting upcoming assignments: {e}")
                result["message"] += f". Could not retrieve upcoming assignments: {str(e)}"

            # Generate study recommendations
            recommendations = []

            # Add recommendations based on upcoming assignments
            if result["upcoming_assignments"]:
                top_priority = result["upcoming_assignments"][0]
                recommendations.append({
                    "type": "assignment_prep",
                    "description": f"Focus on preparing for {top_priority['name']}" +
                                  (f" due on {top_priority['due_date']}" if top_priority.get('due_date') else ""),
                    "priority": "High"
                })

            # Add recommendations based on weak areas
            for area in result["focus_areas"]:
                recommendations.append({
                    "type": "skill_improvement",
                    "description": f"Improve skills in {area['area']}",
                    "priority": area.get("priority", "Medium")
                })

            # If we don't have any specific recommendations, add some general ones
            if not recommendations:
                if result["current_grade"]:
                    recommendations.append({
                        "type": "general_improvement",
                        "description": "Review your current course materials and notes",
                        "priority": "Medium"
                    })
                    recommendations.append({
                        "type": "general_improvement",
                        "description": "Meet with your instructor during office hours to discuss improvement strategies",
                        "priority": "High"
                    })
                else:
                    recommendations.append({
                        "type": "general_improvement",
                        "description": "Review your course syllabus and upcoming assignments",
                        "priority": "High"
                    })
                    recommendations.append({
                        "type": "general_improvement",
                        "description": "Create a study schedule for this course",
                        "priority": "Medium"
                    })

            result["recommendations"] = recommendations
            result["message"] += ". Study plan generated successfully"

            return result

        except Exception as e:
            print(f"Error in generate_study_plan: {e}")
            return {
                "course_id": course_id,
                "course_name": "Unknown Course",
                "message": f"Error generating study plan: {str(e)}",
                "error": True,
                "recommendations": [
                    {
                        "type": "error_recovery",
                        "description": "Review your course syllabus and upcoming assignments",
                        "priority": "High"
                    },
                    {
                        "type": "error_recovery",
                        "description": "Meet with your instructor during office hours to discuss your progress",
                        "priority": "High"
                    }
                ]
            }
