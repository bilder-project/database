import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts'

const getAllUsers = async (supabase)=>{
    const { data , error  } = await supabase
      .from('users_data')
      .select('*');
    if (error) throw error;
    return data;
}

const getSearchLogs = async (supabase)=>{
    const { data , error  } = await supabase
      .from('search_log')
      .select('*');
    if (error) throw error;
    return data;
}

const getVisitedLogs = async (supabase)=>{
    const { data , error  } = await supabase
      .from('visited_log')
      .select('*');
    if (error) throw error;
    return data;
}

const getProperties = async (supabase)=>{
    const { data , error  } = await supabase
      .from('properties')
      .select('*');
    if (error) throw error;
    return data;
}

const generateRecommendations = async (users, searchLogs, visitedLogs, properties) => {
  const recommendations = {};

  // Loop over all users
  for (const user of users) {
    // Create a new array to store recommendations
    recommendations[user.id] = [];
    // Get searchLogs and visitedLogs for the user
    const userSearchLogs = searchLogs.filter((log) => log.user_id === user.id);
    const userVisitedLogs = visitedLogs.filter((log) => log.user_id === user.id);

    // Get unique property_ids from visitedLogs
    const visitedPropertyIds = userVisitedLogs.map((log) => log.property_id);

    // Get a list of unique search types in format searchTypes = ['apartment', 'house', 'villa']
    let searchTypes = userSearchLogs.map((log) => log.types).filter((value, index, self) => self.indexOf(value) === index);
    // Flatten searchTypes array
    searchTypes = searchTypes.flat();

    console.log("searchTypes", searchTypes);

    // Get a mean of all search_log prices
    const meanPriceMin = userSearchLogs.reduce((acc, log) => acc + log.price_min, 0) / userSearchLogs.length;
    const meanPriceMax = userSearchLogs.reduce((acc, log) => acc + log.price_max, 0) / userSearchLogs.length;
    const meanPrice = (meanPriceMin + meanPriceMax) / 2;

    console.log("meanPrice", meanPrice);

    // Get a mean of all search_log sizes
    const meanSizeMin = userSearchLogs.reduce((acc, log) => acc + log.size_min, 0) / userSearchLogs.length;
    const meanSizeMax = userSearchLogs.reduce((acc, log) => acc + log.size_max, 0) / userSearchLogs.length;
    const meanSize = (meanSizeMin + meanSizeMax) / 2;

    console.log("meanSize", meanSize);

    // Find all properties that have size 50 plus or minus the mean size 
    // Find all properties that have price 100 plus or minus the mean price
    const recommendedProperties = properties.filter((property) => {
      return (
        Math.abs(property.size - meanSize) <= 5000 &&
        Math.abs(property.price - meanPrice) <= 100000 &&
        !visitedPropertyIds.includes(property.id) &&
        searchTypes.includes(property.type)
      );
    });

    // Randomly select 1 property from the recommended properties, if there are any, and add it to the recommendations
    if (recommendedProperties.length > 0) {
      recommendations[user.id].push(recommendedProperties[Math.floor(Math.random() * recommendedProperties.length)]);
    } 
  }

  return recommendations;
}

const sendEmail = async(emailTo, nameTo,content, subject) => {
  // Call post to the https://dqundwtpkgtfhreonqkd.supabase.co/functions/v1/send-email endpoint
  const response = await fetch('https://dqundwtpkgtfhreonqkd.supabase.co/functions/v1/send-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      'Authorization': 'Bearer ' + Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    },
    body: JSON.stringify({
      emailTo,
      nameTo,
      content,
      subject
    })
  });

  console.log(response);
}

const handleRecommendations = async (recommendatons: Record<string, any>, users: any[]) => {
    for (const [userId, recommendedProperties] of Object.entries(recommendatons)) {
        const user = users.find((user) => user.id === userId);
        const emailTo = user.email;
        const nameTo = user.first_name;
        const subject = "Recommended properties";
        let content = `Hello ${nameTo}, here are your recommended properties: `;

        // Add property name, size, price and location to the content, each on a new line
        for (const property of recommendedProperties) {
            content += `\n${property.name}, ${property.size}m², ${property.price}€, ${property.location}`;
        }

        // Check if user has any recommended properties
        if (recommendedProperties.length === 0) {
            continue;
        }
        const res = await sendEmail(emailTo, nameTo, content, subject);
    }
}

serve(async (req)=>{

    // Enable CORS
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
        global: {
            headers: {
                Authorization: ("Bearer " + Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")) ?? ""
            }
        }
    });
    try {
        const data = await req.json();
        // Get all data with promise.all
        const [users, searchLogs, visitedLogs, properties] = await Promise.all([
            getAllUsers(supabase),
            getSearchLogs(supabase),
            getVisitedLogs(supabase),
            getProperties(supabase)
        ]);

        const recommendations = await generateRecommendations(users, searchLogs, visitedLogs, properties);

        await handleRecommendations(recommendations, users);
        

        return new Response(JSON.stringify({
            recommendations: recommendations
        }), {
            headers: {
                "Content-Type": "application/json",
                ...corsHeaders
            },
            status: 200
        });
    } catch (error) {
        return new Response(JSON.stringify({
            message: error.message
        }), {
            headers: {
                "Content-Type": "application/json"
            },
            status: 400
        });
    }
});
